import {loadState} from "../app/middleware/ledgerUtils"; 
import {filterObject} from "../app/components/utils"

export const publicBoardsInitial = ledgerConn => {
  const ledgerURL = process.env.USE_SANDBOX
    ? "http://localhost:7575/"
    : `https://api.projectdabl.com/data/${process.env.DABL_LEDGER}/`;

  var _state = null;
  var _stateAt = 0;

  return async (req, res, next) => {
    if (Date.now() >= _stateAt + 1000 * 10) {
      const jwt = await ledgerConn.adminToken();
      _state = await loadState(ledgerURL, jwt);
      _stateAt = Date.now();
    }

    const state = await _state;
    req.initialState = { 
      ...req.initialState,
      boardsById: filterObject(state.boardsById, board => board.isPublic),
      listsById: filterObject(state.listsById, list => state.boardsById[list.boardId].isPublic),
      cardsById: filterObject(state.cardsById, card => state.boardsById[card.boardId].isPublic),
      };
    next();
  }
};

export const publicBoards = (req, res) => res.json({
  boardsById: req.initialState.boardsById,
  listsById: req.initialState.listsById,
  cardsById: req.initialState.cardsById
});
