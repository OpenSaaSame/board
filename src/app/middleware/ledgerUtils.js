import fetch from "node-fetch";
import NestedError from "nested-error-stacks";
import {mapBy} from "../components/utils"

export const appVersions = [
    "Danban.V2",
    "Danban.V3"
];

export const rootErr = err => {
    while(err.nested)
      err = err.nested
    return err;
  }

export const processResponse = async response => {
    try{
        if(!response.ok) {
            const body = await response.text();
            throw new Error(`Bad response from ledger: ${response.status} ${response.statusText} ${body}`);
        }
        try{
            const json = await response.json();
            return json["result"];
        } catch (err) {
            console.log(err);
            throw new Error(`Non-JSON response from ledger: ${response.status} ${response.statusText} ${err}`);
        }
    } catch (err) {
        console.log(response);
        throw new NestedError("Error processing response", err);
    }
}

export const callAPI = async (url, token, method, body) => {
    try {
        return fetch(
            url,
            {
                "credentials":"include",
                "headers":{
                    "accept":"application/json",
                    "authorization":"Bearer " + token,
                    "content-type":"application/json",
                    "sec-fetch-mode":"cors"
                },
                "body": JSON.stringify(body),
                "method": method,
                "mode":"cors"
            }
        );
    } catch(err) {
            throw new NestedError("Error fetching" + url + " with token " + token + ", method " + method + ", body " + JSON.stringify(body) + ": ", err);
    };
}

const callAndProcessAPI = async (url, token, method, body) => {
    try {
        const response = await callAPI(url, token, method, body);
        return processResponse(response);
    } catch (err) {
        throw err;
    }
}

export const create = async (ledgerUrl, jwt, templateId, argument) => callAndProcessAPI (
                ledgerUrl + "command/create",
                jwt,
                "POST",
                {
                    templateId,
                    argument
                }
            );

export const search = async (ledgerUrl, jwt, templateId, filter) => {
    try {
        const response = await callAndProcessAPI(
                ledgerUrl + "contracts/search",
                jwt,
                "POST",
                {
                    "templateIds": [templateId]
                }
            )
        return response.filter(filter);
    } catch(err) {
        throw new NestedError(`Error fetching ${JSON.stringify(templateId)} contracts: `, err);
    }
}

const dataTemplates = [
    ["User", "Profile"],
    ["Rules", "Board"]
].concat(
    ["Data", "CardList", "Card", "Comment", "Tag"].map(e => ["Board", e])
);

const exclusions = {
    "Danban.V2" : {
        "Board" : ["Comment", "Tag"]
    }
};

const versionedTempates = dataTemplates.flatMap(t => 
    appVersions.flatMap(v => 
        exclusions[v] && exclusions[v][t[0]] && exclusions[v][t[0]].includes(t[1])
        ? []
        : `${v}.${t[0]}:${t[1]}`
    ))
    

export const loadAll = async (ledgerUrl, jwt) => callAndProcessAPI(
        ledgerUrl + "contracts/search",
        jwt,
        "POST",
        {
            "templateIds": versionedTempates
        }
    );

const templateModule = c => c.templateId instanceof Object
    ? c.templateId.moduleName
    : c.templateId.split(":")[1];

const templateEntity = c => c.templateId instanceof Object
    ? c.templateId.entityName
    : c.templateId.split(":")[2];

const templateVersion = c => {
    const tm = templateModule(c);
    return tm.substr(0, tm.lastIndexOf("."));
}

const unversionedModule = c => {
    const tm = templateModule(c);
    return tm.substr(tm.lastIndexOf(".") + 1);
}

const filterGroupAndVersion = (party, cs) => {
    let ctMap = {};
    dataTemplates.forEach(t => {
        if(!ctMap[t[0]]) ctMap[t[0]] = {};
        ctMap[t[0]][t[1]] = [];
    });
    cs.forEach(c => {
        if(!party || c.observers.includes(party) || c.signatories.includes(party)) {
            ctMap[unversionedModule(c)][templateEntity(c)].push({
                ... c.payload,
                version : templateVersion(c)
            })
        }
    })
    return ctMap
}

export const loadState = async (ledgerUrl, jwt, party = null) => {
    try {
        const contracts = await loadAll(ledgerUrl, jwt);

        const contractMap = filterGroupAndVersion(party, contracts);

        const boardsById = mapBy("_id")(contractMap["Board"]["Data"]);
        const listsById = mapBy("_id")(contractMap["Board"]["CardList"]);
        const cardsById = mapBy("_id")(contractMap["Board"]["Card"]);
        const commentsById = mapBy("_id")(contractMap["Board"]["Comment"]);
        const tagsById = mapBy("_id")(contractMap["Board"]["Tag"]);
        const users = (contractMap["User"]["Profile"]);
        users.sort((a,b) => (a.displayName > b.displayName) ? 1 : ((b.displayName > a.displayName) ? -1 : 0)); 
        const boardUsersById = mapBy("boardId")(contractMap["Rules"]["Board"]);

        return {
            boardsById,
            listsById,
            cardsById,
            commentsById,
            tagsById,
            users,
            boardUsersById
        }
    } catch(err) {
      throw new NestedError(`Error processing all contracts: `, err);
    }
}


export const exercise = (ledgerUrl, jwt, templateId, contractId, choice, argument) => callAndProcessAPI (
        ledgerUrl + "command/exercise",
        jwt,
        "POST",
        {
            templateId,
            choice,
            contractId,
            argument
        }
    );