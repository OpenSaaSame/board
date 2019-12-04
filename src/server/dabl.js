import fetch from "node-fetch";
import NestedError from "nested-error-stacks";
import {callAPI, search} from "../app/middleware/ledgerUtils";
import {getOrCreateApp, getOrCreateContract, getUser, getUserProfile, getOrCreateUserProfile} from "./ledger"
const url = require("url");

const dabl = () => {
    let refreshCookie = process.env.REFRESH_COOKIE;
    const dablUrl = "https://api.projectdabl.com/";
    const ledgerId = process.env.DABL_LEDGER;
    
    const ledgerSegment = `/${ledgerId}/`;
    const adminParty = process.env.DABL_ADMIN;
    const dataURL = dablUrl + "data" + ledgerSegment;

    let refreshCookieTime = null;
    
    let jwts = {};

    let appCid = null;

    const getSiteJWT = async () => {
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
            try {
                const response = await fetch(
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
                );
                if(response.status === 302) {
                    let raw = response.headers.raw();
                    let redirectURL = url.parse(raw["location"][0], true);
                    if(redirectURL.query["access_token"] === undefined) 
                        throw new Error("No access_token in response " + raw["location"]);
                    refreshCookie = raw['set-cookie'][0];
                    refreshCookieTime = Date.now();
                    jwts["site"].time = Date.now();
                    jwts["site"].token = redirectURL.query["access_token"];
                }
                else {
                    throw new Error("Redirect expected!");
                }
            } catch(err) {
                throw new NestedError("Error getting site JWT: ", err);
            }
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

    const getToken = async party => {
        // Get a new Token every 12 hours
        let need_new_party_jwt
            = jwts[party] == undefined
            || jwts[party].token == undefined
            || jwts[party].time == undefined
            || Date.now() > jwts[party].time + 1000 * 60 * 60 * 12;
    
        if(need_new_party_jwt) {
            console.log("Getting token for party ", party);
            jwts[party] = {};
            try {
                const jwt = await getSiteJWT();
                const response = await fetchFromAPI(
                    "api/ledger",
                    "parties/token",
                    jwt,
                    "POST",
                    {
                        "as": party,
                        "for": 86400
                    }
                );
                const json = await response.json();
                jwts[party].time = Date.now();
                jwts[party].token = json["access_token"];
            } catch(err) {
                    throw new NestedError("Error getting JWT for" + party + ": ", err);
            }
        }
        return jwts[party].token;
    };

    const adminToken = () => getToken(adminParty);

    const createUser = async user => {
        try {
            console.log("Creating user");
            const jwt = await getSiteJWT();
            const response = await fetchFromAPI(
                    "api/ledger",
                    "parties",
                    jwt,
                    "POST",
                    {
                        "partyName": user
                    }
                )
            if(!response.ok) {
                const body = await response.text();
                throw new Error(`Error creating user: ${response.status} ${response.statusText} ${body}`);
            }
        } catch(err) {
            throw new NestedError("Error creating user: ", err);
        }
    }

    const getApp = async () => {
        try {
            const jwt = await adminToken();
            if(appCid == null) appCid = getOrCreateApp(dataURL, adminParty, jwt);
            return await appCid;
        } catch (err) {
            throw new Error("Error getting app", err);
        }
    }

    const getDABLUser = async user => {
        let party_ = null;

        const userParty = async () => {
            if(party_ == null) {
                console.log("Getting user party");

                try {
                    const [app, adminJwt] = await Promise.all([getApp(), adminToken()]);
                    const createCb = async () => {
                        try {
                            await createUser(user);
                            const response = await search(
                                dataURL,
                                adminJwt,
                                {
                                    "moduleName": "DABL.Ledger",
                                    "entityName": "LedgerParty"
                                },
                                userParty => userParty.argument.partyName == user
                            );
                            return response[0];
                        } catch (err) {
                            throw new NestedError(`Failed to create party for user ${user}: `, err);
                        }
                    }
                    const contract = await getOrCreateContract(
                        app,
                        adminJwt,
                        {
                            "moduleName": "DABL.Ledger",
                            "entityName": "LedgerParty"
                        },
                        userParty => userParty.argument.partyName == user,
                        createCb
                    );
                    party_ = contract.argument.party;
                } catch(err) {
                    throw new NestedError(`Failed to get the party for ${user}: `, err);
                }
            }
            return party_;
        }
    
        const userToken = async () => {
            try {
                const party = await userParty();
                return await getToken(party);
            } catch (err) {
                throw new NestedError(`Error getting user token for ${user}: `, err);
            }
        }

        try {
            const [app, party, partyJwt, adminJwt] = await Promise.all([getApp(), userParty(), userToken(), adminToken()]);
            return getUser(app, user, party, partyJwt, adminParty, adminJwt);
        } catch(err) {
            throw new NestedError(`Failed to get user ${user}: `, err);
        }
    };

    const getOrCreateDablUserProfile = async (user, profile) => {
        try {
            const app = await getApp();
            return getOrCreateUserProfile(dataURL, app.version, user, profile);
        } catch (err) {
            throw new NestedError(`Failed to get or create DABL user profile for ${user}: `, err);
            
        }
    }

    return {
        adminToken,
        getUser: getDABLUser,
        getUserProfile : user => getUserProfile(dataURL, user),
        getOrCreateUserProfile : getOrCreateDablUserProfile
    }
}

export default dabl;
