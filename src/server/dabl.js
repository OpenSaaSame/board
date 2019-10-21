import fetch from "node-fetch";
import NestedError from "nested-error-stacks";
const url = require("url");

const dabl = () => {
    let refreshCookie = process.env.REFRESH_COOKIE;
    const dablUrl = "https://api.projectdabl.com/";
    const ledgerId = process.env.DABL_LEDGER;
    
    const ledgerSegment = `/${ledgerId}/`
    const adminParty = `dabl_admin-${ledgerId}` 

    let refreshCookieTime = null;
    
    let jwts = {};

    const getSiteJWT = () => {
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
                    return redirectURL.query["access_token"]
                }
                else {
                    throw new Error("Redirect expected!");
                }
            }).catch(err => {
                throw new NestedError("Error getting site JWT: ", err);
            });
        }
        else
            console.log("Using cached site jwt");
        return jwts["site"].token;
    };

    const fetchFromAPI = (api, path, token, method, body) => {
        console.log("Fetching ", dablUrl + api + ledgerSegment + path);
        return fetch(
            dablUrl + api + ledgerSegment + path,
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
            throw new NestedError("Error fetching" + path + ", " + token + ", " + method + ", " + JSON.stringify(body) + ": ", err);
        });
    };

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
                        "token",
                        jwt,
                        "POST",
                        {
                            "as": party,
                            "for": 86400
                        }
                    ).then(response => {
                        if(!response.ok) {
                            return response.text().then(body => {
                                throw new Error(`Bad response from DABL: ${response.status} ${response.statusText} ${body}`);
                            });
                        }
                        return response.json();
                    })
                    .then(response => {
                        jwts[party].time = Date.now();
                        return response["access_token"];
                    });
                })
                .catch(err => {
                    throw new NestedError("Error getting JWT for" + party + ": ", err);
                });
            }
        else
            console.log("Using cached token for party ", party);
        return jwts[party].token;
    };

    const adminToken = () => {
        return getToken(adminParty);
    };

    const fetchUserContracts = user => {
        console.log("Fetching user contracts");
        return adminToken()
        .then(adminJWT => {
            return fetchFromAPI(
                "data",
                "contracts/search",
                adminJWT,
                "POST",
                {
                    "%templates": [
                        {
                            "moduleName": "DABL.User",
                            "entityName": "UserParty"
                        }
                    ],
                    "partyName": user
                }
            )
            .catch(err => {
                throw new NestedError("Error fetchung user contracts: ", err);
            });
        })
        .then(response => {
            if(!response.ok) {
                return response.text().then(body => {
                    throw new Error(`Bad response from DABL: ${response.status} ${response.statusText} ${body}`);
                });
            }
            return response.json();
        })
        .then(response => {
            let ret = response["result"]
            .filter(userParty => {
                return userParty.argument.partyName == user;
            });
            console.log(ret.length, "User contracts found");
            return ret;
        })
        .catch(err => {
            throw new NestedError("Error fetching user contracts for " + user + ": ", err);
        });
    };

    const createUser = user => {
        console.log("Creating user");
        return getSiteJWT()
        .then(jwt => {
            return fetchFromAPI(
                "api/ledger",
                "data/parties",
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

    const getUser = user => {
        let party_ = null;
        let userToken_ = null;

        const userParty = () => {
            console.log("Getting user party");
            if(party_ == null)
                party_ = fetchUserContracts(user)
                .then(contracts => {
                    if(contracts.length == 0)
                        return createUser(user)
                        .then(() => {return fetchUserContracts(user)})
                        .then(contracts => {
                            if(contracts.length == 0) throw new NestedError("Unexpectedly didn't find user contract after creating.");
                            return contracts[0].argument.party
                        }).catch(err => {
                            throw new NestedError(`Failed create user ${user}: `, err);
                        });
                    else return contracts[0].argument.party
                }).catch(err => {
                    throw new NestedError(`Failed to get UserParty contract for ${user}: `, err);
                });
            return party_;
        }
    
        const userToken = user => {
            return userParty()
            .then(party => {
                return getToken(party);
            });
        }

        return userToken()
        .then(token => {
            return userParty()
            .then(party => {
                return {
                    "userName": user,
                    "party": party,
                    "token": token
                    }
            });
        }).catch(err => {
            throw new NestedError(`Failed to get user ${user}: `, err);
        });
    };

    return {
        getUser: getUser
    }
}

export default dabl;
