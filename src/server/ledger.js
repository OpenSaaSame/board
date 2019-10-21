import fetch from "node-fetch";
import NestedError from "nested-error-stacks";

const ledgerURL = () => `https://api.projectdabl.com/data/${process.env.DABL_LEDGER}/`;

const fetchUserProfiles = user => {
    console.log(ledgerURL());
    return fetch(
        ledgerURL() + "contracts/search",
        {
            "credentials":"include",
            "headers":{
                "accept":"application/json",
                "authorization":"Bearer " + user.token,
                "content-type":"application/json",
                "sec-fetch-mode":"cors"
            },
            "method": "POST",
            "body" : JSON.stringify({
                "%templates": [
                    {
                        "moduleName": "Danban",
                        "entityName": "UserProfile"
                    }
                ]
            }),
            "mode":"cors"
        }
    )
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
                return userParty.argument.party == user.party;
            });
        console.log(`${ret.length} User Profiles found for ${user.party}`);
        return ret;
    })
    .catch(err => {
        throw new NestedError("Error fetching user profiles for " + user.party + ": ", err);
    });
}

const createProfile = (user, profile) => {
    return fetch(
        ledgerURL() + "command/create",
        {
            "credentials":"include",
            "headers":{
                "accept":"application/json",
                "authorization":"Bearer " + user.token,
                "content-type":"application/json",
                "sec-fetch-mode":"cors"
            },
            "method": "POST",
            "body" : JSON.stringify({
                "templateId": {
                    "moduleName": "Danban",
                    "entityName": "UserProfile"
                },
                "argument": {
                    "party": user.party,
                    "displayName": profile.displayName,
                    "imageUrl": profile._json.image.url
                }
            }),
            "mode":"cors"
        }
    )
    .then(response => {
        if(!response.ok) {
            return response.text().then(body => {
                throw new Error(`Bad response from DABL: ${response.status} ${response.statusText} ${body}`);
            });
        }
        return response.json();
    })
    .then(response => {
        return response["result"][0].created;
    })
    .catch(err => {
        throw new NestedError("Error fetching user profiles for " + user.party + ": ", err);
    });
};

export const getUserProfile = user => {
    return fetchUserProfiles(user)
    .then(profiles => {
        if(profiles.length == 0) throw new Error("No profiles found for party " + user.party)
        else {
            let profile = profiles[0].argument;
            profile._id = user.userName;
            profile.party = user.party;
            profile.token = user.token;
            profile.cid = profiles[0].contractId;
            return profile;
        }
    });
}

export const getOrCreateUserProfile = (user, profile) => {
    return fetchUserProfiles(user)
    .then(profiles => {
        if(profiles.length == 0) return createProfile(user, profile);
        else return profiles[0];
    })
    .then(userProfile => {
        let p = userProfile.argument;
        p._id = user.userName;
        p.party = user.party;
        p.token = user.token;
        p.cid = userProfile.contractId;
        return p;
    });
}