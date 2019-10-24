const boardUsersById = (state = {}, action) => {
  switch (action.type) {
    case "ADD_BOARD": {
        const { boardId, userId } = action.payload;
        return {
          ...state,
          [boardId]: {
            boardId,
            users: [{"_1": userId, "_2": "SignedAdmin"}],
          }
        };
      }    
    case "DELETE_BOARD": {
      const { boardId } = action.payload;
      const { [boardId]: deletedBoard, ...restOfBoards } = state;
      return restOfBoards;
    }
    case "SUCCEED_READ": {
      return action.payload.boardUsers;
    }
    default:
      return state;
  }
};
  
export default boardUsersById;
