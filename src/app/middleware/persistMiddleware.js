import { denormalize, schema } from "normalizr";

const ledgerUrl = "/api/";

const exercise = (user, template, cid, choice, args) => {
  return fetch(
    ledgerUrl + "command/exercise",
    {
        "credentials":"include",
        "headers":{
            "accept":"application/json",
            "authorization":"Bearer " + user.token,
            "content-type":"application/json",
        },
        "method": "POST",
        "body" : JSON.stringify({
          "templateId": {
            "moduleName": "Danban",
            "entityName": template
          },
          "contractId": cid,
          "choice": choice,
          "argument": args
      })
    });
}

const loadAll = (user) => {
  return fetch(
    ledgerUrl + "contracts",
    {
      "credentials":"include",
      "headers":{
          "accept":"application/json",
          "authorization":"Bearer " + user.token,
          "content-type":"application/json",
      },
      "method": "GET"
    }
  )
}

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
    
    const cardSchema = new schema.Entity("cardsById", {}, { idAttribute: "_id" });
    const listSchema = new schema.Entity(
      "listsById",
      { cards: [cardSchema] },
      { idAttribute: "_id" }
    );
    const boardSchema = new schema.Entity(
      "boardsById",
      { lists: [listSchema] },
      { idAttribute: "_id" }
    );
    const entities = { cardsById, listsById, boardsById };

    const boardData = denormalize(boardId, boardSchema, entities);

    const boardKey = {
      ref : boardId,
      admins : [user.party]
    }

    let board = {
      "id" : boardKey,
      "title" : boardData.title,
      "color" : boardData.color,
      "users" : [],
      "obs" : [],
      "columns" : boardData.lists.map(c => c._id)
    }

    let columns = boardData.lists.map(col => ({
      "board" : boardKey,
      "ref" : col._id,
      "title" : col.title,
      "cards" : col.cards.map(card => card._id)
    }));

    let cards = boardData.lists.flatMap(col => {
      return col.cards.map(card => ({
        "board" : boardKey,
        "column" : col._id,
        "ref" : card._id,
        "color" : card.color,
        "text" : card.text,
        "due" : card.date
      }))
    });

    exercise (
      user,
      "UserProfile",
      user.cid,
      "PutBoard",
      {
        "board": board,
        "columns": columns,
        "cards": cards
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

const maybeRead = (user, ledger, store) => {
  if(ledger.read.queued && !ledger.read.inProgress) {
    store.dispatch({
      type : "START_READ",
      payload: { at : Date.now() }
    });
    
    loadAll(user)
    .then(response => response.json())
    .then(contracts => {

      const boardList = contracts.result.filter(c => c.templateId.startsWith("Danban:Board")).map(c => c.argument);
      const columnList = contracts.result.filter(c => c.templateId.startsWith("Danban:Column")).map(c => c.argument);
      const cardList = contracts.result.filter(c => c.templateId.startsWith("Danban:Card")).map(c => c.argument);

      const boards = {};
      const lists = {}
      const cards = {};

      boardList.forEach(board => {
        boards[board.id.ref] = {
          _id : board.id.ref,
          title : board.title,
          color : board.color,
          users : board.users,
          lists : board.columns
        };
      });

      columnList.forEach(list => {
        lists[list.ref] = {
          _id : list.ref,
          cards : list.cards,
          title : list.title
        };
      })

      cardList.forEach(card => {
        cards[card.ref] = {
          _id : card.ref,
          color : card.color,
          text : card.text,
          date : card.due
        };
      });

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
          boardsById[boardId].columns.forEach(col => {
            lists[col] = listsById[col];
            listsById[col].cards.forEach(card => {
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
