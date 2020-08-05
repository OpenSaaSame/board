import { combineReducers } from "redux";

import cardsById from "./cardsById";
import listsById from "./listsById";
import boardsById from "./boardsById";
import commentsById from "./commentsById";
import tagsById from "./tagsById";
import user from "./user";
import ledger from "./ledger";
import users from "./users";
import boardUsersById from "./boardUsersById";
import upgradeInvites from "./upgradeInvites"

export const login = (party, token) => ({
    'type': 'LOG_IN',
    'payload': { party, token }
});

export default (state = {}, action) => {
    if (action.type === "LOG_IN") {
        const { party, token } = action.payload;
        return {
            ...state,
            cardsById: {},
            listsById: {},
            boardsById: {},
            upgradeInvites: {},
            loggedIn: true,
            user: { party, token, version: 'Danban.V3_2' }
        };
    }
    if (action.type === "LOG_OUT") {
        return {
            ...state,
            loggedIn: false,
            user: undefined
        }
    }
    if (action.type !== "@@redux/INIT" && (!state.loggedIn || state.user.skippedUpgrade)) return state;

    let { loggedIn, ...others } = state;

    return {
        loggedIn,
        ...combineReducers({
            cardsById,
            listsById,
            boardsById,
            commentsById,
            tagsById,
            user,
            ledger,
            users,
            boardUsersById,
            upgradeInvites
        })(others, action)
    }
}
