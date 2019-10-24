import {loadAll, exercise as exerciseUtil} from "./ledgerUtils"

const ledgerUrl = "/api/";

const exercise = (user, cid, choice, args) => exerciseUtil(
    ledgerUrl,
    user.token,
    {
      "moduleName": "Danban.Role",
      "entityName": "User"
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
  const actionFn = exerciseUserChoice(action.type);

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

const exerciseUserChoice = (choice) => (state, boardId, payload) => exercise (
    state.user,
    state.user.cid,
    choice,
    payloadTransform[choice](boardId, payload)
)

const payloadTransform = {
  "ADD_BOARD": (boardId, payload) => ({ boardId, title: payload.boardTitle }),
  "DELETE_BOARD": (boardId, payload) => ({ boardId }),
  "CHANGE_BOARD_TITLE": (boardId, payload) => ({ boardId, newTitle: payload.boardTitle }),
  "CHANGE_BOARD_COLOR": (boardId, payload) => ({ boardId, newColor: payload.color }),
  "ADD_LIST": (boardId, payload) => ({ boardId, title: payload.listTitle, listId: payload.listId }),
  "DELETE_LIST": (boardId, payload) => ({ boardId, listId: payload.listId }),
  "MOVE_LIST": (boardId, payload) => ({ boardId, oldIdx: payload.oldListIndex, newIdx: payload.newListIndex }),
  "CHANGE_LIST_TITLE": (boardId, payload) => ({ listId: payload.listId, newTitle: payload.listTitle }),
  "ADD_CARD": (boardId, payload) => ({ listId: payload.listId, cardId: payload.cardId, text: payload.cardText }),
  "MOVE_CARD": (boardId, payload) => ({ sourceListId: payload.sourceListId, destListId: payload.destListId, oldIdx: payload.oldCardIndex, newIdx: payload.newCardIndex }),
  "DELETE_CARD": (boardId, payload) => ({ listId: payload.listId, cardId: payload.cardId }),
  "CHANGE_CARD_TEXT": (boardId, payload) => ({ cardId: payload.cardId, newText: payload.cardText }),
  "CHANGE_CARD_DATE": (boardId, payload) => ({ cardId: payload.cardId, newDate: payload.date }),
  "CHANGE_CARD_COLOR": (boardId, payload) => ({ cardId: payload.cardId, newColor: payload.color }),
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

      const isTemplate = (c, template) => c.templateId instanceof Object
        ? c.templateId.entityName === template
        : c.templateId.startsWith(`Danban:${template}@`);

      const boards = sortById(contracts.filter(c => isTemplate(c, "Board")).map(c => c.argument));
      const lists = sortById(contracts.filter(c => isTemplate(c, "CardList")).map(c => c.argument));
      const cards = sortById(contracts.filter(c => isTemplate(c, "Card")).map(c => c.argument));

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
      case "ADD_BOARD":
      case "DELETE_BOARD":

      case "CHANGE_BOARD_TITLE":
      case "CHANGE_BOARD_COLOR":
      
      case "ADD_LIST":
      case "DELETE_LIST":
      case "MOVE_LIST": 
      case "CHANGE_LIST_TITLE":

      case "ADD_CARD":
      case "MOVE_CARD":
      case "DELETE_CARD":

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
