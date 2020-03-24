const ledger = (state = {
    network: {
      error: null,
      retry: false
    },
    write : {
      queue: [], 
      inProgress: false,
      error: null
    }, 
    read: {
      queued: true, 
      inProgress: false, 
      cancelled: false
    }
  }, action) => {
  switch (action.type) {
    case "QUEUE_READ": {
      return {
        ...state,
        read: {
          ...state.read,
          queued: true
        }
      }
    }
    case "START_READ": {
      return {
        ...state,
        read: {
          ...state.read,
          queued: false,
          cancelled: false,
          inProgress: true
        }
      }
    }
    case "SUCCEED_READ": {
      return {
        ...state,
        network: {
          ...state.network,
          error: null
        },
        read: {
          ...state.read,
          inProgress: false
        }
      }
    }
    case "CANCEL_READ": {
      return {
        ...state,
        read: {
          ...state.read,
          queued: true,
          inProgress: false
        }
      }
    }     
    case "QUEUE_WRITE": {
      return {
        ...state,
        read: {
          ...state.read,
          cancelled: true
        },
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
      return {
        ...state,
        network: {
          ...state.network,
          error: null
        },
        read: {
          ...state.read,
          queued: true
        },
        write: {
          ...state.write,
          queue : state.write.queue.slice(1),
          inProgress: false
        }
      }
    }

    case "FAIL_WRITE": {
      const {err} = action.payload;
      const giveUp =  state.write.queue[0].attempt >= 10;

      return {
        ...state,
        network: {
          ...state.network,
          error: null
        },
        write: {
          ...state.write,
          inProgress: false,
          queue: giveUp ? state.write.queue.slice(1) : state.write.queue,
          error: giveUp ? err : state.write.error
        }
      }
    }

    case "CLEAR_ERROR": {
      return {
        ...state,
        write: {
          ...state.write,
          error: null
        }
      }
    }

    case "NETWORK_RETRY": {
      return {
        ...state,
        network: {
          ...state.network,
          retry: true
        }
      }
    }

    case "NETWORK_ERROR": {
      const {err} = action.payload;
      return {
        ...state,
        network: {
          error : err,
          retry: false
        },
        write: {
          ...state.write,
          inProgress: false
        },
        read: {
          ...state.read,
          inProgress: false
        }
      }
    }
    default:
      return state;
  }
};
  
  export default ledger;
  