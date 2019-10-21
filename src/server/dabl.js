import fetch from "node-fetch";
import NestedError from "nested-error-stacks";
const url = require('url');

const dabl = () => {
    const dablUrl = "https://api.projectdabl.com/";
    const ledgerId = "dqbqr7j8q5y7oab5";
    let refreshCookie = "__DABL_SESSION=gAAAAABdrVtXSMKnWllk9mU0eZRaXluGtWI9Et3KzEJUvMIefzs0W5u4SbTRMcqJk2Sbg219NrBxJiH9TQm3KuQqF-3VCtvgckg9M2vNfS7qJnC4Y_JjRe81dL6n2rG7Rnoi0wCKnZc6KUcjsQWVDJENOK0-Oo6d9kLQF3K7TNyBQDGcvtv2wJTOGA0GJJ5ROxiGpnjgujajzwpuRdBo5_Jzs8F7lS1rmCVEiDKbFSxrpcjYOrsHpIGxXLLE13-JnnoHtXW3eNvOb1PpdlmzfLktrGOtMHzPcEqz32HY7dhcfK3KjeJnQ2JMrsFkUPqoXp9Xt96iaWBRYewItUnM7lHAhXEvvXuBro7runlA29bXy8U2kDyaE4-SGFqVLZRMGS67fU_j6r9Kouf1mcBJcUYqLXPiEBoiBnNrOfCxQnJ_g7jbeXmxpy58OXI_-LuXhupo5JXUHcz84__yF7Mkjj2KFYyqBY_6x1VeDsPwJ3WTHsK90A7WWbsJ41dKOWjX0cXi4xCQ7qRjEp1GIsBUx-t3nLsZH5X30hr8rHonFBOVf-T5dZCdxFPCDumCm-4Rkmnfn-ANmwjwFl1idjp6FyKDV0bsY8Z-irLsMf6v663_U-CwMaelUok2X_bYlzeZPS7fXv4I7U_BK5Jh3TZL23VkVA6mtwfZEqmKppx7WqzlT3mVn2--kZPRUP6nnn71UnL1p6AKYQBlLu5OeKcQbfb8JqIcX1MBukdOv6Otm3p4uAyOIc91dqu2nqC2kuAh-j9vzCCnUfqacfdhLDrUC8lUAz2EPgwLmQG5uI1Vb2d54jJtapxC9aXGbAaAD2MPtNblLPhz-1ufWsvZHD7PBQc9Bg523CXIwEeeD6zdclbwdR5GAbf4cJhx25-Foszp93JbFs28cGCdP2Y65WEHsl6QB9XF4olFLuFJltfvDXGqVfeqoPYcKmO7GfXH0S4cMD4tGItcQ1V11fJeJ79qCcSRC9lcuIux9ZfRvbonigmUVnKd0wxy2t-wfDAlBONQQhDD4AMRW5VcUDKKGqtUd6CaKpy2MnkoVxPnrFmshedfz5GCVtC7EqnrmA8qrKIQ2BAe5WLb96TsknCkKcqX9ZiGplfYylZB-NRDwzfhZ_w_WVISS_TLgLoFZXtpgJTU-nTarz6qGpai1K60bV7oh71OXeHKYTdVHOUr9wkXJRq7BJfNV20tpWEzk-2iE4RAMcy9qcES3HvPHN7kX1m3ZhQvD_0w2IhszHEiaPNIJUz2jStDo_yTi9HfNuxksBH642q7zIaEUSgc8bqnfOAEolEj_Wp71On5lgYar1uzOFed7xq0iTloUcl10vRoKj6C-zeYVYd6ytBRFBK6tf9zbPM7tAJpZjUgpIBgEhTMHHqRiFADHEXx5VaAyZbX860E-4xYdTaMI3KEyg5OCYpTIprIlBV1UMeMrZI-uetH_jBatazonxHkDbZDYN-vSLUUVqxqZaiutNWwSnRRXVNEonkhQHBsoeAAa7kiolDT3hU_p9HR82TxUKQ7d3BqjGz27jDzmbhxC2FqHR5c8_0mj_VdOgdIdrFniYSqlnsgSG3LP_bvbFMFQbvPl-8dhZajB32gt-Sqz3LJx16OzFPih9BEv1P5p6zT9cAGTCzH0wTsbjQVp6An0jIV9wm1EL75hf6CS9z2E03TEK5dLsQp1VjXOEJYwTpw0A==";
    
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
