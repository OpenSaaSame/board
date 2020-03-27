const user = (state = {}, action) => {
  switch (action.type) {
    case "SKIP_UPGRADE":
      return {
        ...state,
        skippedUpgrade: true
      }
    default:
      return state;
    case "SUCCEED_READ": {
      return {...state, ...action.payload.user}
    }
  }
};

export default user;
