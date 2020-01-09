import {loadState} from "../app/middleware/ledgerUtils"; 
import {mapBy, filterObject} from "../app/components/utils"

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
    const publicCards = filterObject(state.cardsById, card => state.boardsById[card.boardId].isPublic);
    const publicCommentIds = Object.entries(publicCards).flatMap(([_id, card]) => card.comments);
    const publicUserIds = Object.entries(publicCards).flatMap(([_id, card]) => card.assignee);
    const publicUsers = Object.entries(filterObject(state.users, user => publicUserIds.includes(user.party))).map(([_id, user]) => user);
    const publicTagIds = Object.entries(publicCards).flatMap(([_id, card]) => card.tags);

    req.initialState = { 
      ...req.initialState,
      boardsById: filterObject(state.boardsById, board => board.isPublic),
      listsById: filterObject(state.listsById, list => state.boardsById[list.boardId].isPublic),
      cardsById: publicCards,
      commentsById: filterObject(state.commentsById, comment => publicCommentIds.includes(comment._id)),
      tagsById: filterObject(state.tagsById, tag => publicTagIds.includes(tag._id)),
      users: {list: publicUsers, byParty: mapBy("party")(publicUsers)}
      };
    next();
  }
};

export const publicBoards = (req, res) => res.json({
  boardsById: req.initialState.boardsById,
  listsById: req.initialState.listsById,
  cardsById: req.initialState.cardsById,
  commentsById: req.initialState.commentsById,
  users: req.initialState.users
});
