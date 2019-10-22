import { combineReducers } from "redux";
import cardsById from "./cardsById";
import listsById from "./listsById";
import boardsById from "./boardsById";
import user from "./user";
import isGuest from "./isGuest";
import currentBoardId from "./currentBoardId";
import ledger from "./ledger";

export default combineReducers({
  cardsById,
  listsById,
  boardsById,
  user,
  isGuest,
  currentBoardId,
  ledger
});
