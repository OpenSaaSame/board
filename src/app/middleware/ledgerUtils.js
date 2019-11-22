import fetch from "node-fetch";
import NestedError from "nested-error-stacks";
import {mapBy} from "../components/utils"

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

export const loadAll = (ledgerUrl, jwt) => callAPI(
        ledgerUrl + "contracts/search",
        jwt,
        "POST",
        {
            "%templates": [
                {
                    "entityName": "Profile",
                    "moduleName": "Danban.User"
                },
                {
                    "entityName": "Board",
                    "moduleName": "Danban.Rules"
                },
                {
                    "entityName": "Profile",
                    "moduleName": "Danban.V2.User"
                },
                {
                    "entityName": "Board",
                    "moduleName": "Danban.V2.Rules"
                }
            ].concat(
                ["Data", "CardList", "Card"].flatMap(entityName => ([
                    {
                        entityName,
                        "moduleName": "Danban.Board"
                    },
                    {
                        entityName,
                        "moduleName": "Danban.V2.Board"
                    },
                ]))
            )
        }
    )
    .then(processResponse)
    .catch(err => {
        throw new NestedError(`Error fetching all contracts: `, err);
    });

export const loadState = (ledgerUrl, jwt, party = null) => loadAll(ledgerUrl, jwt)
  .then(contracts => {
    const isTemplate = (c, moduleName, entityName) => c.templateId instanceof Object
        ? c.templateId.entityName === entityName && (c.templateId.moduleName === `Danban.${moduleName}` || c.templateId.moduleName === `Danban.V2.${moduleName}`)
        : c.templateId.startsWith(`Danban.${moduleName}:${entityName}@`) || c.templateId.startsWith(`Danban.V2.${moduleName}:${entityName}@`);

    const hasObs = c => !party || c.observers.includes(party) || c.signatories.includes(party);

    const boardsById = mapBy("_id")(contracts.filter(c => hasObs(c) && isTemplate(c, "Board", "Data")).map(c => c.argument));
    const listsById = mapBy("_id")(contracts.filter(c => hasObs(c) && isTemplate(c, "Board", "CardList")).map(c => c.argument));
    const cardsById = mapBy("_id")(contracts.filter(c => hasObs(c) && isTemplate(c, "Board", "Card")).map(c => c.argument));
    const users = contracts.filter(c => isTemplate(c, "User", "Profile")).map(c => c.argument);
    users.sort((a,b) => (a.displayName > b.displayName) ? 1 : ((b.displayName > a.displayName) ? -1 : 0)); 
    const boardUsersById = mapBy("boardId")(contracts.filter(c => isTemplate(c, "Rules", "Board")).map(c => c.argument));

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