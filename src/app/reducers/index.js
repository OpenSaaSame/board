import { combineReducers } from "redux";
import cardsById from "./cardsById";
import listsById from "./listsById";
import boardsById from "./boardsById";
import user from "./user";
import ledger from "./ledger";
import users from "./users";
import boardUsersById from "./boardUsersById";

export default (state = {loggedIn: false}, action) => {
  if(action.type === "LOG_IN")
    return {
      ...state,
      loggedIn: true
    };
  if(action.type !== "@@redux/INIT" && !state.loggedIn) return state;

  let {loggedIn, ...others} = state;

  return {
    loggedIn,
    ...combineReducers({
      cardsById,
      listsById,
      boardsById,
      user,
      ledger,
      users,
      boardUsersById
    })(others, action)
  }
}
