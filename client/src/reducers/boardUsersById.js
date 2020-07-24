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
    case "ADD_USER": {
      const { boardId, newUser } = action.payload;
      return {
        ...state,
        [boardId]: {
          ...state[boardId],
          users: [{"_1": newUser, "_2": "Read"}].concat(state[boardId].users)
        }
      }
    }
    case "REMOVE_USER": {
      const { boardId, user } = action.payload;
      return {
        ...state,
        [boardId]: {
          ...state[boardId],
          users: state[boardId].users.filter(u => u._1 !== user)
        }
      }
    }
    case "CHANGE_PERMISSIONS": {
      const { boardId, user, access } = action.payload;
      return {
        ...state,
        [boardId]: {
          ...state[boardId],
          users: state[boardId].users.map(u => u._1 !== user ? u : {...u, _2: access})
        }
      }
    }
    case "SUCCEED_READ": {
      return {...state, ...action.payload.boardUsersById};
    }
    default:
      return state;
  }
};
  
export default boardUsersById;
