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
      const needsUpgrade = action.payload.upgradeInvites.length !== 0;
      return {
        ...state,
        needsUpgrade,
        ...action.payload.user
      }
    }
  }
};

export default user;
