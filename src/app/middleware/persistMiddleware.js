import {loadAll, exercise as exerciseUtil} from "./ledgerUtils"
import {mapBy} from "../components/utils"

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
  "ADD_BOARD": (boardId, payload) => ({ boardId: payload.boardId, title: payload.boardTitle }),
  "TOGGLE_PUBLIC": (boardId, payload) => payload,
  "CHANGE_PERMISSIONS": (boardId, payload) => payload,
  "ADD_USER": (boardId, payload) => payload,
  "REMOVE_USER": (boardId, payload) => payload,
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

      const isTemplate = (c, moduleName, entityName) => c.templateId instanceof Object
        ? c.templateId.entityName === entityName && c.templateId.moduleName === moduleName
        : c.templateId.startsWith(`${moduleName}:${entityName}@`);

      const boards = mapBy("_id")(contracts.filter(c => isTemplate(c, "Danban.Board", "Data")).map(c => c.argument));
      const lists = mapBy("_id")(contracts.filter(c => isTemplate(c, "Danban.Board", "CardList")).map(c => c.argument));
      const cards = mapBy("_id")(contracts.filter(c => isTemplate(c, "Danban.Board", "Card")).map(c => c.argument));
      const users = contracts.filter(c => isTemplate(c, "Danban.User", "Profile")).map(c => c.argument);
      users.sort((a,b) => (a.displayName > b.displayName) ? 1 : ((b.displayName > a.displayName) ? -1 : 0)); 
      const boardUsers = mapBy("boardId")(contracts.filter(c => isTemplate(c, "Danban.Rules", "Board")).map(c => c.argument));

      store.dispatch({
        type : "SUCCEED_READ",
        payload: {
          boards,
          lists,
          cards,
          users,
          boardUsers
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
      case "TOGGLE_PUBLIC":
      case "ADD_USER":
      case "REMOVE_USER":
      case "CHANGE_PERMISSIONS":
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
