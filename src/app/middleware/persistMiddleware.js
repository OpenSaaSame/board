import { denormalize, schema } from "normalizr";

// Persist the board to the database after almost every action.
const persistMiddleware = store => next => action => {
  next(action);
  const {
    user,
    boardsById,
    listsById,
    cardsById,
    currentBoardId: boardId
  } = store.getState();

  // Nothing is persisted for guest users
  if (user) {
    if (action.type === "DELETE_BOARD") {
      fetch(
        ledgerUrl + "/api/command/exercise",
        {
            "credentials":"include",
            "headers":{
                "accept":"application/json",
                "authorization":"Bearer " + user.token,
                "content-type":"application/json",
                "sec-fetch-mode":"cors"
            },
            "method": "POST",
            "body" : JSON.stringify({
                "templateId": {
                    "moduleName": "Danban",
                    "entityName": "UserProfile"
                },
                "contractId": user.cid,
                "choice": "DeleteBoard",
                "argument": {
                    "ref": boardId
                }
            }),
            "mode":"cors"
        }
      )

      // All action-types that are not DELETE_BOARD or PUT_BOARD_ID_IN_REDUX are currently modifying a board in a way that should
      // be persisted to db. If other types of actions are added, this logic will get unwieldy.
    } else if (action.type !== "PUT_BOARD_ID_IN_REDUX" && action.type !== "LOAD_DATA") {
      // Transform the flattened board state structure into the tree-shaped structure that the db uses.
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

      // TODO: Provide warning message to user when put request doesn't work for whatever reason
      fetch(
        "/api/command/exercise",
        {
            "credentials":"include",
            "headers":{
                "accept":"application/json",
                "authorization":"Bearer " + user.token,
                "content-type":"application/json",
                "sec-fetch-mode":"cors"
            },
            "method": "POST",
            "body" : JSON.stringify({
                "templateId": {
                    "moduleName": "Danban",
                    "entityName": "UserProfile"
                },
                "contractId": user.cid,
                "choice": "PutBoard",
                "argument": {
                    "board": board,
                    "columns": columns,
                    "cards": cards
                }
            }),
            "mode":"cors"
        }
      )
    }
  }
};

export default persistMiddleware;
