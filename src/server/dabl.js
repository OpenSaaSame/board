import fetch from "node-fetch";
import NestedError from "nested-error-stacks";
import {processResponse, callAPI, exercise, search} from "../app/middleware/ledgerUtils";
import {getOrCreateApp} from "./ledger"
const url = require("url");

const dabl = () => {
    let refreshCookie = process.env.REFRESH_COOKIE;
    const dablUrl = "https://api.projectdabl.com/";
    const ledgerId = process.env.DABL_LEDGER;
    
    const ledgerSegment = `/${ledgerId}/`
    const adminParty = `dabl_admin-${ledgerId}` 
    const dataURL = dablUrl + "data" + ledgerSegment

    let refreshCookieTime = null;
    
    let jwts = {};

    let appCid = null;

    const getSiteJWT = () => {
        if(process.env.SITE_JWT) return Promise.resolve(process.env.SITE_JWT);

        // Get a new refresh token every 2 weeks.
        let need_new_refresh_token
            = refreshCookieTime == null 
            || Date.now() > refreshCookieTime + 1000 * 60 * 60 * 24 * 14;
        // Get a new site JWT every 12 hours
        let need_new_site_jwt
            = jwts["site"] == undefined
            || jwts["site"].token == undefined
            || jwts["site"].time == undefined
            || Date.now() > jwts["site"].time + 1000 * 60 * 60 * 12;

        if(need_new_refresh_token || need_new_site_jwt) {
            console.log("Refreshing site JWT");
            jwts["site"] = {};
            jwts["site"].token = fetch(
                'https://login.projectdabl.com/auth/login',
                {
                    "credentials":"include",
                    "headers":{
                        "sec-fetch-mode":"cors",
                        "cookie" : refreshCookie 
                    },
                    "mode":"cors",
                    "redirect": 'manual'
                }
            ).then(response => {
                if(response.status === 302) {
                    let raw = response.headers.raw();
                    let redirectURL = url.parse(raw["location"][0], true);
                    if(redirectURL.query["access_token"] === undefined) 
                        throw new Error("No access_token in response " + raw["location"]);
                    refreshCookie = raw['set-cookie'][0];
                    refreshCookieTime = Date.now();
                    jwts["site"].time = Date.now();
                    return redirectURL.query["access_token"];
                }
                else {
                    throw new Error("Redirect expected!");
                }
            }).catch(err => {
                throw new NestedError("Error getting site JWT: ", err);
            });
        }
        return jwts["site"].token;
    };

    const fetchFromAPI = (api, path, token, method, body) => {
        console.log(`Calling ${dablUrl + api + ledgerSegment + path} with ${JSON.stringify(body)}`);
        return callAPI(
            dablUrl + api + ledgerSegment + path,
            token,
            method,
            body
        );
    }

    const getToken = party => {
        // Get a new Token every 12 hours
        let need_new_party_jwt
            = jwts[party] == undefined
            || jwts[party].token == undefined
            || jwts[party].time == undefined
            || Date.now() > jwts[party].time + 1000 * 60 * 60 * 12;
    
        if(need_new_party_jwt) {
            console.log("Getting token for party ", party);
            jwts[party] = {};
            jwts[party].token =
                getSiteJWT()
                .then(jwt => {        
                    return fetchFromAPI(
                        "api/ledger",
                        "parties/token",
                        jwt,
                        "POST",
                        {
                            "as": party,
                            "for": 86400
                        }
                    )
                    .then(response => response.json())
                    .then(response => {
                        jwts[party].time = Date.now();
                        return response["access_token"];
                    });
                })
                .catch(err => {
                    throw new NestedError("Error getting JWT for" + party + ": ", err);
                });
            }
        return jwts[party].token;
    };

    const adminToken = () => {
        return getToken(adminParty);
    };

    const fetchContracts = (jwtPromise, template, filter) => jwtPromise.then(jwt => {
        console.log(`Fetching contracts ${JSON.stringify(template)}`) 
        return search (
            dataURL, jwt, template, filter
        );    
    });    

    const getOrCreateContract = (jwtPromise, template, filter, createCb) => {
        return fetchContracts(jwtPromise, template, filter)
        .then(contracts => {
            if(contracts.length > 0) return contracts[0];
            else return createCb();
        })
        .catch(err => {
            throw new NestedError(`Error fetching or creating ${JSON.stringify(template)} contracts: `, err);
        });
    }

    const createUser = user => {
        console.log("Creating user");
        return getSiteJWT()
        .then(jwt => {
            return fetchFromAPI(
                "api/ledger",
                "parties",
                jwt,
                "POST",
                {
                    "partyName": user
                }
            ).then(response => {
                if(!response.ok) {
                    return response.text().then(body => {
                        throw new Error(`Error creating user: ${response.status} ${response.statusText} ${body}`);
                    });
                }
            });
        }).catch(err => {
            throw new NestedError("Error creating user: ", err);
        });
    };

    const callApp = (choice, argument) => adminToken()
        .then(jwt => {
            if(appCid == null) appCid = getOrCreateApp(adminParty, jwt);
            console.log(`Making app call ${choice} with ${JSON.stringify(argument)}`)
            return appCid
            .then(cid => exercise(
                    dataURL,
                    jwt,
                    {
                        "moduleName": "Danban",
                        "entityName": "Admin"
                    },
                    cid,
                    choice,
                    argument
                )
                .catch(err => {
                    throw new NestedError(`Error calling app choice ${choice} with ${argument}`, err);
                })
            )
            .catch(err => {
                throw new NestedError(`Error getting app cid or calling app choice ${choice} with ${argument}`, err);
            })
        });

    const getUser = user => {
        let party_ = null;

        const userParty = () => {
            if(party_ == null) {
                console.log("Getting user party");
                party_ = getOrCreateContract(
                    adminToken(),
                    {
                        "moduleName": "DABL.Ledger",
                        "entityName": "LedgerParty"
                    },
                    userParty => userParty.argument.partyName == user,
                    () => createUser(user)
                    .then(() => fetchContracts(
                        adminToken(),
                        {
                            "moduleName": "DABL.Ledger",
                            "entityName": "LedgerParty"
                        },
                        userParty => userParty.argument.partyName == user
                    ))
                    .then(response => response[0])
                )
                .then(contract => {
                    return contract.argument.party
                })
                .catch(err => {
                    throw new NestedError(`Failed to get the party  for ${user}: `, err);
                });
            }
            return party_;
        }
    
        const userToken = () => {
            return userParty()
            .then(party => {
                return getToken(party);
            });
        }

        const userRole = () => userParty()
            .then(party => getOrCreateContract(
                    userToken(),
                    {
                        "moduleName": "Danban.Role",
                        "entityName": "User"
                    },
                    role => role.argument.party == party && role.argument.operator == adminParty,
                    () => 
                    callApp("PauseApp", {})
                    .then(() =>
                        callApp(
                            "AddUser",
                            {
                                "party": party,
                                "operator": adminParty
                            }
                        )
                        .then(ret => {
                            return callApp("UnpauseApp", {})
                            .then(() => ret);
                        })
                        .catch(err => {
                            callApp("UnpauseApp", {});
                            throw new NestedError(`Error creating user role. Unpausing.`, err);
                        })
                    )
                    .then(response => {
                        console.log(`Role response: ${response}`)
                        return response[response.length - 1].created;
                    })
                    .catch(err => {
                        throw new NestedError(`Error creating User Role for ${user}`, err)
                    })
                )
                .then(contract => contract.contractId)
                .catch(err => {
                    throw new NestedError(`Error getting or creating User Role for ${user}`, err)
                })
            )
            .catch(err => {
                throw new NestedError(`Failed to get the role for ${user}: `, err);
            });

        return userToken()
        .then(token => {
            return userParty()
            .then(party => {
                return userRole()
                .then(roleCid => {
                    return {
                        "userName": user,
                        "party": party,
                        "token": token,
                        "cid" : roleCid,
                        "operator" : adminParty
                        }
                })
            });
        }).catch(err => {
            throw new NestedError(`Failed to get user ${user}: `, err);
        });
    };

    return {
        adminToken,
        getUser
    }
}

export default dabl;
