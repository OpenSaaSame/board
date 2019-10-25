import NestedError from "nested-error-stacks";
import {exercise, search} from "../app/middleware/ledgerUtils";
import { JWT, JWK } from "jose"
import {getOrCreateApp} from "./ledger"


const sandbox = () => {
    const adminParty = "Admin" 
    const dataURL = "http://localhost:7575/"

    let appCid = null;
    
    const getToken = party => {
        return JWT.sign(
            {
                "ledgerId": "danban",
                "applicationId": "danban",
                "party": party
            },
            JWK.asKey("secret", {"alg": "HS256"}),
            {
                "header": {
                    "alg": "HS256",
                    "typ": "JWT"
                }
            }
        )
    };

    const adminToken = () => {
        return getToken(adminParty);
    };

    const fetchContracts = (jwt, template, filter) => search (
            dataURL, jwt, template, filter
        );        

    const getOrCreateContract = (jwt, template, filter, createCb) => {
        return fetchContracts(jwt, template, filter)
        .then(contracts => {
            if(contracts.length > 0) return contracts[0];
            else return createCb();
        })
        .catch(err => {
            throw new NestedError(`Error fetching or creating ${JSON.stringify(template)} contracts: `, err);
        });
    }

    const callApp = (choice, argument) => {
        if(appCid == null) appCid = getOrCreateApp(adminParty, adminToken());
        return appCid
        .then(cid => exercise(
                dataURL,
                adminToken(),
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
    }

    const getUser = user => {

        const userRole = () => getOrCreateContract(
                getToken(user),
                {
                    "moduleName": "Danban.Role",
                    "entityName": "User"
                },
                role => role.argument.party == user && role.argument.operator == adminParty,
                () => 
                callApp("PauseApp", {})
                .then(() =>
                    callApp(
                        "AddUser",
                        {
                            "party": user,
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
                    return response[response.length - 1].created;
                })
                .catch(err => {
                    throw new NestedError(`Error creating User Role for ${user}`, err)
                })
            )
            .then(contract => contract.contractId)
            .catch(err => {
                throw new NestedError(`Error getting or creating User Role for ${user}`, err)
            });

        return userRole()
        .then(roleCid => ({
            "userName": user,
            "party": user,
            "token": getToken(user),
            "cid" : roleCid,
            "operator" : adminParty
            })
        )
        .catch(err => {
            throw new NestedError(`Failed to get user ${user}: `, err);
        });
    };

    return {
        adminToken,
        getUser
    }
}

export default sandbox;
