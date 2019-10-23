import {loadAll, exercise as exerciseUtil} from "./ledgerUtils"

const ledgerUrl = "/api/";

const exercise = (user, template, cid, choice, args) => exerciseUtil(
    ledgerUrl,
    user.token,
    {
      "moduleName": "Danban",
      "entityName": template
    },
    cid,
    choice,
    args
  );

const maybeWrite = (state, dispatch) => {
  const {
    user,
    ledger
  } = state;

  if(ledger.write.queue.length == 0 || ledger.write.inProgress) return;

  dispatch({
    type : "START_WRITE",
    payload: { }
  });

  const action = ledger.write.queue[0];
  let actionFn = null;

  switch(action.type) {
    case "DELETE_BOARD":
      actionFn = deleteBoard;
      break;
      
      case "ADD_LIST":
      case "MOVE_LIST": 
      case "DELETE_LIST":
      case "ADD_BOARD":
      case "CHANGE_BOARD_TITLE":
      case "CHANGE_BOARD_COLOR":

      case "ADD_CARD":
      case "MOVE_CARD":
      case "DELETE_CARD":
      case "CHANGE_LIST_TITLE":

      case "CHANGE_CARD_TEXT":
      case "CHANGE_CARD_DATE": 
      case "CHANGE_CARD_COLOR":
        actionFn = writeBoard;
  }

  actionFn(state, action.boardId, action.payload)
  .then(r => {
    dispatch({
      type : "SUCCEED_WRITE",
      payload: { "at": Date.now() }
    });
  })
  .catch(err => {
    console.log(err);
    dispatch({
      type : "FAIL_WRITE",
      payload: { }
    });
  })
}

const deleteBoard = (state, boardId, payload) => exercise(
    state.user,
    "UserProfile",
    state.user.cid,
    "DeleteBoard",
    {
      "ref": boardId
    }
  );

const writeBoard = (state, boardId, payload) => {
  const{
    user,
    boardsById,
    listsById,
    cardsById
  } = state;

  const extraFields = {
    operator : user.party,
    admins : [user.party],
    obs : []
  };

  const withExtraFields = (extraFields, item) => {
    Object.keys(extraFields).forEach(key => item[key] = extraFields[key]);
    return item;
  }

  let board = withExtraFields(extraFields, boardsById[boardId]);
  extraFields.boardId = boardId;
  let lists = board.lists.map(listId => withExtraFields(extraFields, listsById[listId]));
  let cards = lists.flatMap(list => {
    extraFields.listId = list._id;
    return list.cards.map(cardId => withExtraFields(extraFields, cardsById[cardId]))
  });

  return exercise (
    user,
    "UserRole",
    user.cid,
    "PutBoard",
    {
      board,
      lists,
      cards
    }
  )
}

const sortById = list => {
  const ret = {};
  list.forEach(item => ret[item._id] = item);
  return ret;
}

const maybeRead = (store) => {
  const {
    ledger,
    user
  } = store.getState();

  if(ledger.read.queued && !ledger.read.inProgress && ledger.write.queue.length == 0) {
    store.dispatch({
      type : "START_READ",
      payload: { at : Date.now() }
    });
    
    loadAll(ledgerUrl, user.token)
    .then(contracts => {
      //If there are changes in flight, queue another read.
      if(store.getState().ledger.write.queue.length > 0) {
        store.dispatch({
          type : "FAIL_READ",
          payload: { at : Date.now() }
        });
        return;
      }

      const boards = sortById(contracts.filter(c => c.templateId.entityName === "Board").map(c => c.argument));
      const lists = sortById(contracts.filter(c => c.templateId.entityName === "CardList").map(c => c.argument));
      const cards = sortById(contracts.filter(c => c.templateId.entityName === "Card").map(c => c.argument));

      store.dispatch({
        type : "SUCCEED_READ",
        payload: {
          boards,
          lists,
          cards
        }
      });
    })
    .catch(err => {
      console.log(err);
      store.dispatch({
        type : "FAIL_READ",
        payload: { at : Date.now() }
      });
    })
  }
}

// Persist the board to the database after almost every action.
const persistMiddleware = store => next => action => {
  next(action);
  const state = store.getState();
  const {
    user,
    currentBoardId: boardId
  } = state;

  // Nothing is persisted for guest users
  if (user) {
    switch(action.type) {
      case "DELETE_BOARD":
        exercise(
          user,
          "UserProfile",
          user.cid,
          "DeleteBoard",
          {
            "ref": boardId
          }
        );
        break;
      
      case "ADD_LIST":
      case "MOVE_LIST": 
      case "DELETE_LIST":
      case "ADD_BOARD":
      case "CHANGE_BOARD_TITLE":
      case "CHANGE_BOARD_COLOR":

      case "ADD_CARD":
      case "MOVE_CARD":
      case "DELETE_CARD":
      case "CHANGE_LIST_TITLE":

      case "CHANGE_CARD_TEXT":
      case "CHANGE_CARD_DATE": 
      case "CHANGE_CARD_COLOR":
        store.dispatch({
          type: "QUEUE_WRITE",
          payload: {
            boardId,
            type: action.type,
            payload: action.payload
          }
        });
        break;

      case "QUEUE_READ":
      case "SUCCEED_READ":
      case "FAIL_READ":
        maybeRead(store);
        break;
      case "SUCCEED_WRITE":
        maybeWrite(state, store.dispatch);
        maybeRead(store);
        break;
      case "FAIL_WRITE":      
      case "QUEUE_WRITE":
        maybeWrite(state, store.dispatch);
        break;
      default:
        break;
    }
  }
};

export default persistMiddleware;
