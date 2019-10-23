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

const maybeWriteBoard = (user, boardId, boardsById, listsById, cardsById, ledger, store) => {
  const dispatch = type => {
    store.dispatch({
      type,
      payload: {
        boardId,
        at : Date.now()
      }
    });
  }

  // Abort after 10 tries
  if(ledger.boards[boardId].attempt >= 10) {
    console.log(`Couldn't write board ${boardId} after ${ledger.boards[boardId].attempt} attempts. Aborting.`);
    dispatch("SUCCEED_WRITE_BOARD");
  }

  if(!ledger.boards[boardId] || (ledger.boards[boardId].queued && !ledger.boards[boardId].writing)) {

    dispatch("START_WRITE_BOARD");

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

    exercise (
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
    .then(r => {
      dispatch("SUCCEED_WRITE_BOARD");
    })
    .catch(err => {
      console.log(err);
      dispatch("FAIL_WRITE_BOARD");
    })
  }
}

const sortById = list => {
  const ret = {};
  list.forEach(item => ret[item._id] = item);
  return ret;
}

const maybeRead = (user, ledger, store) => {
  if(ledger.read.queued && !ledger.read.inProgress) {
    store.dispatch({
      type : "START_READ",
      payload: { at : Date.now() }
    });
    
    loadAll(ledgerUrl, user.token)
    .then(contracts => {

      const boards = sortById(contracts.result.filter(c => c.templateId.entityName === "Board").map(c => c.argument));
      const lists = sortById(contracts.result.filter(c => c.templateId.entityName === "CardList").map(c => c.argument));
      const cards = sortById(contracts.result.filter(c => c.templateId.entityName === "Card").map(c => c.argument));

      // Don't overwrite changes that are in-flight
      const {
        boardsById,
        listsById,
        cardsById,
        ledger
      } = store.getState();

      Object.keys(ledger.boards).forEach(boardId => {
        if(ledger.boards[boardId].queued || ledger.boards[boardId].writing || (ledger.boards[boardId].written > ledger.read.inProgress)) {
          boards[boardId] = boardsById[boardId];
          boardsById[boardId].lists.forEach(list => {
            lists[list] = listsById[list];
            listsById[list].cards.forEach(card => {
              cards[card] = cardsById[card];
            })
          })
        }
      });

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
  const {
    user,
    boardsById,
    listsById,
    cardsById,
    currentBoardId: boardId,
    ledger
  } = store.getState();

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
          type: "QUEUE_WRITE_BOARD",
          payload: {
            boardId,
            at: Date.now()
          }
        });
        break;

      case "QUEUE_READ":
      case "SUCCEED_READ":
      case "FAIL_READ":
        maybeRead(user, ledger, store);
        break;
      case "SUCCEED_WRITE_BOARD":
        maybeWriteBoard(user, boardId, boardsById, listsById, cardsById, ledger, store);
        maybeRead(user, ledger, store);
        break;
      case "FAIL_WRITE_BOARD":      
      case "QUEUE_WRITE_BOARD":
        maybeWriteBoard(user, boardId, boardsById, listsById, cardsById, ledger, store);
        break;
      default:
        break;
    }
  }
};

export default persistMiddleware;
