const ledger = (state = {write : {queue: [], inProgress: false}, read: {queued: true, inProgress: false}}, action) => {
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
      case "QUEUE_WRITE": {
        return {
          ...state,
          write: {
            ...state.write,
            queue: [{...action.payload, "attempt": 0}, ...state.write.queue]
          }
        }
      }

      case "START_WRITE": {
        return {
          ...state,
          write: {
            ...state.write,
            inProgress: true,
            queue: [{
                ...state.write.queue[0],
                attempt: state.write.queue[0].attempt + 1
              },
              ...state.write.queue.slice(1)
            ]
          }
        }
      }

      case "SUCCEED_WRITE": {
        const { at } = action.payload;
        return {
          ...state,
          read: {
            ...state.read,
            queued: at
          },
          write: {
            ...state.write,
            queue : state.write.queue.slice(1),
            inProgress: false
          }
        }
      }

      case "FAIL_WRITE": {
        return {
          ...state,
          write: {
            ...state.write,
            inProgress: false,
            queue: state.write.queue[0].attempt >= 10 ? state.write.queue.slice(1) : state.write.queue
          }
        }
      }
      default:
        return state;
    }
  };
  
  export default ledger;
  