import fetch from "node-fetch";
import NestedError from "nested-error-stacks";
import {mapBy} from "../components/utils"

export const appVersions = [
    "Danban",
    "Danban.V2"
];

export const rootErr = err => {
    while(err.nested)
      err = err.nested
    return err;
  }

export const processResponse = response => {
    if(!response.ok) {
        return response.text().then(body => {
            throw new Error(`Bad response from ledger: ${response.status} ${response.statusText} ${body}`);
        });
    }
    return response.json().then(response => response["result"]);
}

export const callAPI = (url, token, method, body) => {
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
        ).catch(err => {
            throw new NestedError("Error fetching" + url + " with token " + token + ", method " + method + ", body " + JSON.stringify(body) + ": ", err);
        });
    };

export const create = (ledgerUrl, jwt, templateId, argument) => callAPI (
        ledgerUrl + "command/create",
        jwt,
        "POST",
        {
            templateId,
            argument
        }
    )
    .then(processResponse)
    .catch(err => {
        throw new NestedError(`Error creating ${JSON.stringify({ templateId, argument })}`, err);
    });

export const search = (ledgerUrl, jwt, templateId, filter) => callAPI(
        ledgerUrl + "contracts/search",
        jwt,
        "POST",
        {
            "%templates": [templateId]
        }
    )
    .then(processResponse)
    .then(response => response.filter(filter))
    .catch(err => {
        throw new NestedError(`Error fetching ${JSON.stringify(templateId)} contracts: `, err);
    });

const dataTemplates = [
    ["User", "Profile"],
    ["Rules", "Board"]
].concat(
    ["Data", "CardList", "Card"].map(e => ["Board", e])
);

const versionedTempates = dataTemplates.flatMap(t => 
    appVersions.map(v => ({
        "entityName" : t[1],
        "moduleName" : `${v}.${t[0]}`
    })))

export const loadAll = (ledgerUrl, jwt) => callAPI(
        ledgerUrl + "contracts/search",
        jwt,
        "POST",
        {
            "%templates": versionedTempates
        }
    )
    .then(processResponse)
    .catch(err => {
        throw new NestedError(`Error fetching all contracts: `, err);
    });

const templateModule = c => c.templateId instanceof Object
    ? c.templateId.moduleName
    : c.templateId.split(":")[0];

const templateEntity = c => c.templateId instanceof Object
    ? c.templateId.entityName
    : c.templateId.split("@").split(":")[1];

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
                ... c.argument,
                version : templateVersion(c)
            })
        }
    })
    return ctMap
}

export const loadState = (ledgerUrl, jwt, party = null) => loadAll(ledgerUrl, jwt)
  .then(contracts => {
    const contractMap = filterGroupAndVersion(party, contracts);

    const boardsById = mapBy("_id")(contractMap["Board"]["Data"]);
    const listsById = mapBy("_id")(contractMap["Board"]["CardList"]);
    const cardsById = mapBy("_id")(contractMap["Board"]["Card"]);
    const users = (contractMap["User"]["Profile"]);
    users.sort((a,b) => (a.displayName > b.displayName) ? 1 : ((b.displayName > a.displayName) ? -1 : 0)); 
    const boardUsersById = mapBy("boardId")(contractMap["Rules"]["Board"]);

    return {
      boardsById,
      listsById,
      cardsById,
      users,
      boardUsersById
    }
  })
  .catch(err => {
      throw new NestedError(`Error processing all contracts: `, err);
  });


export const exercise = (ledgerUrl, jwt, templateId, contractId, choice, argument) => callAPI (
        ledgerUrl + "command/exercise",
        jwt,
        "POST",
        {
            templateId,
            choice,
            contractId,
            argument
        }
    )
    .then(processResponse)
    .catch(err => {
        throw new NestedError(`Error exercising ${JSON.stringify({ contractId, choice, templateId, argument })}`, err);
    });