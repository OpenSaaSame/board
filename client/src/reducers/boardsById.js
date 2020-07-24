const boardsById = (state = {}, action) => {
  switch (action.type) {
    case "TOGGLE_PUBLIC": {
      const { boardId } = action.payload;
      return {
        ...state,
        [boardId]: {
          ...state[boardId],
          isPublic: !state[boardId].isPublic
        }
      };
    }
    case "ADD_LIST": {
      const { boardId, listId } = action.payload;
      return {
        ...state,
        [boardId]: {
          ...state[boardId],
          lists: [...state[boardId].lists, listId]
        }
      };
    }
    case "MOVE_LIST": {
      const { oldListIndex, newListIndex, boardId } = action.payload;
      const newLists = Array.from(state[boardId].lists);
      const [removedList] = newLists.splice(oldListIndex, 1);
      newLists.splice(newListIndex, 0, removedList);
      return {
        ...state,
        [boardId]: { ...state[boardId], lists: newLists }
      };
    }
    case "DELETE_LIST": {
      const { listId: newListId, boardId } = action.payload;
      return {
        ...state,
        [boardId]: {
          ...state[boardId],
          lists: state[boardId].lists.filter(listId => listId !== newListId)
        }
      };
    }
    case "ADD_BOARD": {
      const { boardTitle, boardId, userId } = action.payload;
      return {
        ...state,
        [boardId]: {
          _id: boardId,
          admins: [userId],
          title: boardTitle,
          lists: [],
          isPublic: false,
          color: "blue",
          about: ""
        }
      };
    }
    case "CHANGE_BOARD_TITLE": {
      const { boardTitle, boardId } = action.payload;
      return {
        ...state,
        [boardId]: {
          ...state[boardId],
          title: boardTitle
        }
      };
    }
    case "CHANGE_BOARD_COLOR": {
      const { boardId, color } = action.payload;
      return {
        ...state,
        [boardId]: {
          ...state[boardId],
          color
        }
      };
    }
    case "CHANGE_BOARD_ABOUT": {
      const { boardId, about } = action.payload;
      return {
        ...state,
        [boardId]: {
          ...state[boardId],
          about
        }
      };
    }
    case "DELETE_BOARD": {
      const { boardId } = action.payload;
      const { [boardId]: deletedBoard, ...restOfBoards } = state;
      return restOfBoards;
    }
    case "ADD_TAG": {
      const { boardId, tagId } = action.payload;
      return { ...state, [boardId]: { ...state[boardId], tags: [ ...state[boardId].tags, tagId ]}};
    }
    case "SUCCEED_READ": {
      return {...state, ...action.payload.boardsById};
    }
    default:
      return state;
  }
};

export default boardsById;
