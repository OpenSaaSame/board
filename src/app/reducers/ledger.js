const ledger = (state = {boards : {}, read: {queued: true, inProgress: false}}, action) => {
    switch (action.type) {
      case "QUEUE_READ": {
        const { at } = action.payload;
        return {
          ...state,
          read: {
            ...state.read,
            queued: at
          }
        }
      }
      case "START_READ": {
        const { at } = action.payload;
        return {
          ...state,
          read: {
            ...state.read,
            queued: false,
            inProgress: at
          }
        }
      }
      case "SUCCEED_READ": {
        return {
          ...state,
          read: {
            ...state.read,
            inProgress: false
          }
        }
      }
      case "FAIL_READ": {
        const { at } = action.payload;
        return {
          ...state,
          read: {
            ...state.read,
            queued: at,
            inProgress: false
          }
        }
      }     
      case "QUEUE_WRITE_BOARD": {
        const { boardId, at } = action.payload;
        return {
          ...state,
          boards: {
            ...state.boards,
            [boardId]: {
              ...state.boards[boardId],
              queued: at
            }
          }
        }
      }
      case "START_WRITE_BOARD": {
        const { boardId, at } = action.payload;
        return {
          ...state,
          boards: {
            ...state.boards,
            [boardId]: {
              ...state.boards[boardId],
              writing : at,
              attempt : (state.boards[boardId].attempt || 0) + 1, 
              queued : false
            }
          }
        }
      }
      case "SUCCEED_WRITE_BOARD": {
        const { boardId, at } = action.payload;
        return {
          ...state,
          read: {
            queued: at
          },
          boards: {
            ...state.boards,
            [boardId]: {
              ...state.boards[boardId],
              attempt : 0,
              writing : false,
              written : at
            }
          }
        }
      }
      case "FAIL_WRITE_BOARD": {
        const { boardId, at } = action.payload;
        return {
          ...state,
          boards: {
            ...state.boards,
            [boardId]: {
              ...state.boards[boardId],
              writing : false,
              queued : at
            }
          }
        }
      }
      default:
        return state;
    }
  };
  
  export default ledger;
  