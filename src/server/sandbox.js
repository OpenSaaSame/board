import fetch from "node-fetch";
import NestedError from "nested-error-stacks";
import {processResponse, callAPI, exercise, search} from "../app/middleware/ledgerUtils";
import { JWT, JWK } from "jose"

const sandbox = () => {
    const adminParty = "Admin" 
    const dataURL = "http://localhost:7575/"
    
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

    const callApp = (choice, argument) => exercise(
            dataURL,
            adminToken(),
            {
                "moduleName": "Danban",
                "entityName": "DanbanApp"
            },
            process.env.APP_CID,
            choice,
            argument
        )
        .catch(err => {
            throw new NestedError(`Error calling app choice ${choice} with ${argument}`, err);
        });

    const getUser = user => {

        const userRole = () => getOrCreateContract(
                getToken(user),
                {
                    "moduleName": "Danban",
                    "entityName": "UserRole"
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
                    return response.result[response.result.length - 1].created;
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
        getUser: getUser
    }
}

export default sandbox;
