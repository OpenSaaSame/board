import {exercise, search} from "../app/middleware/ledgerUtils";


const ledgerURL = () => process.env.USE_SANDBOX
? "http://localhost:7575/"
: `https://api.projectdabl.com/data/${process.env.DABL_LEDGER}/`;

const fetchUserProfiles = user => search(
        ledgerURL(),
        user.token,
        {
            "moduleName": "Danban",
            "entityName": "UserProfile"
        },
        userParty => userParty.argument.party == user.party && userParty.argument.operator == user.operator
    )

const createProfile = (user, profile) => exercise(
        ledgerURL(),
        user.token,
        {
            "moduleName": "Danban",
            "entityName": "UserRole"
        },
        user.cid,
        "PutProfile",
        {
            "displayName": profile.displayName,
            "imageUrl": profile._json.image.url
        }
    )
    .then(response => {
        console.log(response);
        return response.result[response.result.length - 1].created
    });
    
export const getUserProfile = user => {
    return fetchUserProfiles(user)
    .then(profiles => {
        if(profiles.length == 0) throw new Error("No profiles found for party " + user.party)
        else {
            let profile = profiles[0].argument;
            profile._id = user.userName;
            profile.party = user.party;
            profile.token = user.token;
            profile.cid = user.cid;
            return profile;
        }
    });
}

export const getOrCreateUserProfile = (user, profile) => {
    console.log(JSON.stringify(user));
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
        p.cid = user.cid;
        return p;
    });
}