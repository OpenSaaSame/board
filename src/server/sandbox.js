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
        return appCid;
    };

    const getSbUser = async user  => {
        try {
            const app = await getApp();
            return getUser(app, user, user, getToken(user), adminParty, getToken(adminParty));
        } catch (err) {
            throw new NestedError ("Error getting User from Sandbox", err);
        }
    }

    const getOrCreateSbUserProfile = async (user, profile)  => {
        try {
            const app = await getApp();
            return getOrCreateUserProfile(dataURL, app.version, user, profile);
        } catch (err) {
            throw new NestedError ("Error getting User from Sandbox", err);
        }
    }

    return {
        adminToken: () => Promise.resolve(getToken(adminParty)),
        getUser: getSbUser,
        getUserProfile : user => getUserProfile(dataURL, user),
        getOrCreateUserProfile : getOrCreateSbUserProfile
    }
}

export default sandbox;
