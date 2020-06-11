/* eslint-disable no-return-assign */
import NestedError from "nested-error-stacks";

const mapBy = field => list => {
  const ret = {};
  list.forEach(item => ret[item[field]] = item);
  return ret;
}

const prefix = process.env.REACT_APP_V3_PACKAGE_ID ? `${process.env.REACT_APP_V3_PACKAGE_ID}:` : "";
export const appVersions = [
  `${prefix}Danban.V3`,
  "Danban.V3_2"
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
      return json.result;
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
          "authorization":`Bearer ${token}`,
          "content-type":"application/json",
          "sec-fetch-mode":"cors"
        },
        "body": JSON.stringify(body),
        "method": method,
        "mode":"cors"
      }
    );
  } catch(err) {
      throw new NestedError(`Error fetching${url} with token ${token}, method ${method}, body ${JSON.stringify(body)}: `, err);
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

export const create = async (ledgerUrl, jwt, templateId, payload) => callAndProcessAPI (
        `${ledgerUrl}create`,
        jwt,
        "POST",
        {
          templateId,
          payload
        }
      );

export const search = async (ledgerUrl, jwt, templateId, filter) => {
  try {
    const response = await callAndProcessAPI(
        `${ledgerUrl}query`,
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
  ["Role", "User"],
  ["Rules", "Board"],
  ["Upgrade", "UpgradeInvite"]
].concat(
  ["Data", "CardList", "Card", "Comment", "Tag"].map(e => ["Board", e])
);

const exclusions = {};

const versionedTempates = dataTemplates.flatMap(t =>
  appVersions.flatMap(v =>
    exclusions[v] && exclusions[v][t[0]] && exclusions[v][t[0]].includes(t[1])
    ? []
    : `${v}.${t[0]}:${t[1]}`
  ))


export const loadAll = async (ledgerUrl, jwt) => callAndProcessAPI(
    `${ledgerUrl}query`,
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
  const ctMap = {};
  dataTemplates.forEach(t => {
    if(!ctMap[t[0]]) ctMap[t[0]] = {};
    ctMap[t[0]][t[1]] = [];
  });
  cs.forEach(c => {
    ctMap[unversionedModule(c)][templateEntity(c)].push({
      ...c.payload,
      version : templateVersion(c),
      cid: c.contractId
    })
  })
  return ctMap
}

export const loadState = async (ledgerUrl, jwt, party = null) => {
  try {
     const contracts = await loadAll(ledgerUrl, jwt);

    const contractMap = filterGroupAndVersion(party, contracts);

    console.log(contractMap);

    const boardsById = mapBy("_id")(contractMap.Board.Data);
    const listsById = mapBy("_id")(contractMap.Board.CardList);
    const cardsById = mapBy("_id")(contractMap.Board.Card);
    const commentsById = mapBy("_id")(contractMap.Board.Comment);
    const tagsById = mapBy("_id")(contractMap.Board.Tag);
    const users = (contractMap.User.Profile).sort((a,b) =>
        (a.displayName > b.displayName) ? 1 : ((b.displayName > a.displayName) ? -1 : 0)
      );
    const boardUsersById = mapBy("boardId")(contractMap.Rules.Board);
    const upgradeInvites = contractMap.Upgrade.UpgradeInvite;

    var user = {};
    if (contractMap.Role.User.length > 0) {
      const userRole = (contractMap.Role.User)[0];
      const userProfile = users.filter(user => user.party === userRole.party)[0];
      user = { ...userProfile, ...userRole, registered: true };
    } else {
      user = { registered: false }
    }

    return {
      boardsById,
      listsById,
      cardsById,
      commentsById,
      tagsById,
      users,
      user,
      boardUsersById,
      upgradeInvites
    }
  } catch(err) {
    console.log(err)
    throw new NestedError(`Error processing all contracts: `, err);
  }
}

export const exercise = (ledgerUrl, jwt, templateId, contractId, choice, argument) => {
  callAndProcessAPI (
    `${ledgerUrl}exercise`,
    jwt,
    "POST",
    {
      templateId,
      choice,
      contractId,
      argument
    }
  )};
