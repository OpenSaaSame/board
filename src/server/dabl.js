import fetch from "node-fetch";
import NestedError from "nested-error-stacks";
import {callAPI, search} from "../app/middleware/ledgerUtils";
import {getOrCreateApp, getOrCreateContract, getUserProfile, getOrCreateUserProfile} from "./ledger"
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

    const getApp = () => adminToken()
        .then(jwt => {
            if(appCid == null) appCid = getOrCreateApp(dataURL, adminParty, jwt);
            return appCid
        });

    const getDABLUser = user => {
        let party_ = null;

        const userParty = () => {
            if(party_ == null) {
                console.log("Getting user party");

                party_ = adminToken()
                    .then(adminJwt => getOrCreateContract(
                        adminJwt,
                        {
                            "moduleName": "DABL.Ledger",
                            "entityName": "LedgerParty"
                        },
                        userParty => userParty.argument.partyName == user,
                        () => createUser(user)
                        .then(() => search(
                            dataURL,
                            adminJwt,
                            {
                                "moduleName": "DABL.User",
                                "entityName": "UserParty"
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
                    })
                )
            }
            return party_;
        }
    
        const userToken = () => {
            return userParty()
            .then(party => {
                return getToken(party);
            });
        }

        return Promise.all(getApp(), userParty(), userToken(), adminToken())
            .then(([app, party, partyJwt, adminJwt]) => getUser(app, user, party, partyJwt, adminParty, adminJwt)
            ).catch(err => {
                throw new NestedError(`Failed to get user ${user}: `, err);
            });
    };

    return {
        adminToken,
        getUser: getDABLUser,
        getUserProfile : user => getUserProfile(dataURL, user),
        getOrCreateUserProfile : (user, profile) => getApp().then(app => getOrCreateUserProfile(dataURL, app.version, user, profile))
    }
}

export default dabl;
