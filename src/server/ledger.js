import {create, exercise, search, appVersions} from "../app/middleware/ledgerUtils";
import NestedError from "nested-error-stacks";

const createProfile = (ledgerUrl, version, user, profile) => exercise(
        ledgerUrl,
        user.token,
        {
            "moduleName": `${version}.Role`,
            "entityName": "User"
        },
        user.cid,
        "PutProfile",
        {
            "displayName": profile.displayName,
            "imageUrl": profile.photos[0].value,
            "email": profile.emails[0].value,
            "domain": profile._json.domain
        }
    )
    .then(response => {
        return response[response.length - 1].created
    });

const profileTemplate = version => ({
    "moduleName": `${version}.User`,
    "entityName": "Profile"
});
    
const getNewestUserProfile = (ledgerUrl, user, remainingVersions) => {
    const head = remainingVersions[0];
    const tail = remainingVersions.slice(1);
    var pProfiles;
    if(tail.length > 0) pProfiles = getNewestUserProfile(ledgerUrl, user, tail);
    else pProfiles = Promise.resolve([]);
    return pProfiles.then(profiles => profiles.length > 0
        ? profiles
        : search(
            ledgerUrl,
            user.token,
            profileTemplate(head),
            profile => profile.argument.operator == user.operator && profile.argument.party == user.party
        )
    );
}

export const getUserProfile = (ledgerUrl, user) => {
    return getNewestUserProfile(ledgerUrl, user, appVersions)
    .then(profiles => {
        if(profiles.length == 0) throw new Error("No profiles found for party " + user.party)
        else return {
                ... profiles[0].argument,
                ... user
        }
    });
}

export const getOrCreateUserProfile = (ledgerUrl, version, user, profile) => {
    return getNewestUserProfile(ledgerUrl, user, appVersions)
    .then(profiles => {
        if(profiles.length == 0) return createProfile(ledgerUrl, version, user, profile);
        else return profiles[0];
    })
    .then(userProfile => ({
        ... userProfile.argument,
        ... user
    }));
}

const latest = appVersions[appVersions.length - 1];

const appTemplate = version => ({
    "moduleName": version == "Danban.V2" ? "Danban.V2_1" : version, // Hack for the V2 bugfix
    "entityName": "Admin"
});

const getApp = (ledgerUrl, admin, jwt, remainingVersions) => {
    const head = remainingVersions[0];
    const tail = remainingVersions.slice(1);
    var pApps;
    if(tail.length > 0) pApps = getApp(ledgerUrl, admin, jwt, tail);
    else pApps = Promise.resolve([]);
    return pApps.then(apps => apps.length > 0
        ? apps
        : search(
            ledgerUrl,
            jwt,
            appTemplate(head),
            app => app.argument.operator == admin
        ).then(foundApps => foundApps.map(c => {
            c.version = head;
            c.ledgerUrl = ledgerUrl;
            return c;
        }))
    );
}

export const getOrCreateApp = (ledgerUrl, admin, jwt) =>
    getApp(ledgerUrl, admin, jwt, appVersions)
    .then(apps => {
        if(apps.length > 0) return {
                version : apps[0].version,
                ledgerUrl: ledgerUrl,
                cid : apps[0].contractId
            }
        else return create (
            ledgerUrl,
            jwt,
            appTemplate(latest),
            { "operator": admin }
        )
        .then(response => exercise(
                ledgerUrl,
                jwt,
                appTemplate (latest),
                process.env.USE_SANDBOX ? response.contractId : response[0].created.contractId,
                "StartApp",
                {}
            )
            .then(() => ({
                cid : process.env.USE_SANDBOX ? response.contractId : response[0].created.contractId,
                ledgerUrl : ledgerUrl,
                version: latest
            }))
            .catch(err => {
                throw new NestedError(`Error starting app: `, err);
            })
        )
        .catch(err => {
            throw new NestedError(`Error creating app: `, err);
        })
    });
    
export const callApp = (app, jwt, choice, argument) => {
    console.log(`Making app call ${choice} with ${JSON.stringify(argument)}`)
    return exercise(
        app.ledgerUrl,
        jwt,
        appTemplate(app.version),
        app.cid,
        choice,
        argument
    )
    .catch(err => {
        throw new NestedError(`Error calling app choice ${choice} with ${argument}`, err);
    })
};

export const getOrCreateContract = (app, jwt, template, filter, createCb) => {
    return search(app.ledgerUrl, jwt, template, filter)
    .then(contracts => {
        if(contracts.length > 0) return contracts[0];
        else return createCb();
    })
    .catch(err => {
        throw new NestedError(`Error fetching or creating ${JSON.stringify(template)} contracts: `, err);
    });
}

const userRole = (app, party, partyJwt, admin, adminJwt) => 
    getOrCreateContract(
        app,
        partyJwt,
        {
            "moduleName": `${app.version}.Role`,
            "entityName": "User"
        },
        role => role.argument.party == party && role.argument.operator == admin,
        () => 
        callApp(app, adminJwt, "PauseApp", {})
        .then(() =>
            callApp(
                app,
                adminJwt,
                "AddUser",
                {
                    "party": party,
                    "operator": admin
                }
            )
            .then(ret => {
                return callApp(app, adminJwt, "UnpauseApp", {})
                .then(() => ret);
            })
            .catch(err => {
                callApp(app, adminJwt, "UnpauseApp", {});
                throw new NestedError(`Error creating user role. Unpausing.`, err);
            })
        )
        .then(response => {
            console.log(`Role response: ${response}`)
            return response[response.length - 1].created;
        })
        .catch(err => {
            throw new NestedError(`Error creating User Role for ${party}`, err)
        })
    )
    .then(contract => contract.contractId)
    .catch(err => {
        throw new NestedError(`Error getting or creating User Role for ${party}`, err)
    })

const userUpgrades = (app, party, partyJwt, admin) => search(
        app.ledgerUrl,
        partyJwt,
        {
            "moduleName": `${app.version}.Upgrade`,
            "entityName": "UpgradeInvite"
        },
        upg => upg.argument.party == party && upg.argument.operator == admin
    );

const upgradeOrRole = (app, party, partyJwt, admin, adminJwt) =>
    (app.version === appVersions[0]
        ? (userRole(app, party, partyJwt, admin, adminJwt)
            .then(roleCid => ({cid: roleCid, needsUpgrade: false, version: app.version})))
        : (userUpgrades(app, party, partyJwt, admin)
            .then(upgrades => {
                if(upgrades.length > 0) return {cid : upgrades[0].contractId, needsUpgrade: true, version: app.version}
                else return userRole(app, party, partyJwt, admin, adminJwt)
                    .then(roleCid => ({cid: roleCid, needsUpgrade: false, version: app.version}))
            })
    )
);

export const getUser = (app, user, party, partyJwt, admin, adminJwt) => 
    upgradeOrRole(app, party, partyJwt, admin, adminJwt)
    .then(uog => ({
            ... uog,
            "_id": user,
            "party": party,
            "token": partyJwt,
            "operator" : admin
        })
    ).catch(err => {
        throw new NestedError(`Failed to get or create user role for ${party}: `, err);
    })