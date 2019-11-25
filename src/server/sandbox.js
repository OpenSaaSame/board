import NestedError from "nested-error-stacks";
import { JWT, JWK } from "jose"
import {getOrCreateApp, getUser, getUserProfile, getOrCreateUserProfile} from "./ledger"


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

    const getApp = () => {
        if(appCid == null) appCid = getOrCreateApp(dataURL, adminParty, getToken(adminParty));
        return appCid
    };

    return {
        adminToken: () => Promise.resolve(getToken(adminParty)),
        getUser: user => getApp().then(app => getUser(app, user, user, getToken(user), adminParty, getToken(adminParty))),
        getUserProfile : user => getUserProfile(dataURL, user),
        getOrCreateUserProfile : (user, profile) => getApp().then(app => getOrCreateUserProfile(dataURL, app.version, user, profile))
    }
}

export default sandbox;
