import {create, exercise, search, appVersions} from "../app/middleware/ledgerUtils";
import NestedError from "nested-error-stacks";

const createProfile = async (ledgerUrl, version, user, profile) => {
    try {
        const response = await exercise(
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
        return response[response.length - 1].created;
    } catch (err) {
        throw new NestedError("Error creating profile", err);
    }
}

const profileTemplate = version => ({
    "moduleName": `${version}.User`,
    "entityName": "Profile"
});
    
const getNewestUserProfile = async (ledgerUrl, user, remainingVersions) => {
    try {
        const head = remainingVersions[0];
        const tail = remainingVersions.slice(1);
        var profiles = [];
        if(tail.length > 0) profiles = await getNewestUserProfile(ledgerUrl, user, tail);
        return profiles.length > 0
            ? profiles
            : search(
                ledgerUrl,
                user.token,
                profileTemplate(head),
                profile => profile.argument.operator == user.operator && profile.argument.party == user.party
            );
    } catch (err) {
        throw err;
    }
}

export const getUserProfile = async (ledgerUrl, user) => {
    try {
        const profiles = await getNewestUserProfile(ledgerUrl, user, appVersions);
        if(profiles.length == 0) throw new Error("No profiles found for party " + user.party)
        else return {
                ... profiles[0].argument,
                ... user
        }
    } catch (err) {
        throw new NestedError("Error getting user profile", err);
    }
}

export const getOrCreateUserProfile = async (ledgerUrl, version, user, profile) => {
    try {
        const profiles = await getNewestUserProfile(ledgerUrl, user, appVersions);
        var userProfile = profiles.length == 0
            ? await createProfile(ledgerUrl, version, user, profile)
            : profiles[0];
        return {
            ... userProfile.argument,
            ... user
        }
    } catch (err) {
        throw new NestedError("Error getting or creating user profile", err);
    }
}

const latest = appVersions[appVersions.length - 1];

const appTemplate = version => ({
    "moduleName": version ,
    "entityName": "Admin"
});

const getApp = async (ledgerUrl, admin, jwt, remainingVersions) => {
    try {
        const head = remainingVersions[0];
        const tail = remainingVersions.slice(1);
        var apps = tail.length > 0
            ? await getApp(ledgerUrl, admin, jwt, tail)
            : [];
        if (apps.length > 0) return apps;
        else {
            const foundApps = await search(
                ledgerUrl,
                jwt,
                appTemplate(head),
                app => app.argument.operator == admin
            );
            return foundApps.map(c => {
                c.version = head;
                c.ledgerUrl = ledgerUrl;
                return c;
            });
        }
    } catch (err) {
        throw new NestedError("Error getting App contract", err);
    }
}

export const getOrCreateApp = async (ledgerUrl, admin, jwt) => {
    try {
        const apps = await getApp(ledgerUrl, admin, jwt, appVersions);
        if(apps.length > 0)
            return {
                version : apps[0].version,
                ledgerUrl: ledgerUrl,
                cid : apps[0].contractId
            }
        else {
            const response = await create (
                ledgerUrl,
                jwt,
                appTemplate(latest),
                { "operator": admin }
              );
            const appCid = process.env.USE_SANDBOX ? response.contractId : response[0].created.contractId;
            await exercise(
                ledgerUrl,
                jwt,
                appTemplate (latest),
                appCid,
                "StartApp",
                {}
            )
            return {
                cid : appCid,
                ledgerUrl : ledgerUrl,
                version: latest
            };
        }
    } catch (err) {
        throw new NestedError(`Error creating app`, err);
    }
}
    
export const callApp = async (app, jwt, choice, argument) => {
    console.log(`Making app call ${choice} with ${JSON.stringify(argument)}`)
    try {
        return await exercise(
            app.ledgerUrl,
            jwt,
            appTemplate(app.version),
            app.cid,
            choice,
            argument
        )
    } catch(err) {
        throw new NestedError(`Error calling app choice ${choice} with ${argument}`, err);
    }
};

export const getOrCreateContract = async (app, jwt, template, filter, createCb) => {
    try {
        const contracts = await search(app.ledgerUrl, jwt, template, filter);
        if(contracts.length > 0) return contracts[0];
        else return createCb();
    } catch(err) {
        throw new NestedError(`Error fetching or creating ${JSON.stringify(template)} contracts: `, err);
    }
}

const userRole = async (app, party, partyJwt, admin, adminJwt) => {
    try {
        const createCb = async () => {
            try {
                await callApp(app, adminJwt, "PauseApp", {});
                const ret = await callApp(
                        app,
                        adminJwt,
                        "AddUser",
                        {
                            "party": party,
                            "operator": admin
                        }
                    );
                await callApp(app, adminJwt, "UnpauseApp", {});
                return ret[ret.length - 1].created;
            } catch (err) {
                try {
                    callApp(app, adminJwt, "UnpauseApp", {});
                    throw new NestedError(`Error creating user role. Unpaused app.`, err);
                } catch (err) {
                    throw new NestedError(`Error creating user role. Failed to unpause.`, err);
                }
            }
        }
        const contract = await getOrCreateContract(
            app,
            partyJwt,
            {
                "moduleName": `${app.version}.Role`,
                "entityName": "User"
            },
            role => role.argument.party == party && role.argument.operator == admin,
            createCb
        )
        return contract.contractId;
    } catch(err) {
        throw new NestedError(`Error getting or creating User Role for ${party}`, err)
    }
}

const userUpgrades = async (app, party, partyJwt, admin) => search(
        app.ledgerUrl,
        partyJwt,
        {
            "moduleName": `${app.version}.Upgrade`,
            "entityName": "UpgradeInvite"
        },
        upg => upg.argument.party == party && upg.argument.operator == admin
    );

const upgradeOrRole = async (app, party, partyJwt, admin, adminJwt) => {
    try {
        if (app.version !== appVersions[0]) {
            const upgrades = await userUpgrades(app, party, partyJwt, admin);
            if(upgrades.length > 0) return {cid : upgrades[0].contractId, needsUpgrade: true, version: app.version};
        }
        const roleCid = await userRole(app, party, partyJwt, admin, adminJwt);
        return {cid: roleCid, needsUpgrade: false, version: app.version};
    } catch (err) {
        throw new NestedError(`Failed to get upgrade or role for ${party}: `, err);
    }
}

export const getUser = async (app, user, party, partyJwt, admin, adminJwt) => {
    try {
        const uog = await upgradeOrRole(app, party, partyJwt, admin, adminJwt);
        return {
            ... uog,
            "_id": user,
            "party": party,
            "token": partyJwt,
            "operator" : admin
        };
    } catch(err) {
        throw new NestedError(`Failed to get or create user role for ${party}: `, err);
    }
}