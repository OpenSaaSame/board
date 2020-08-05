const upgradeInvites = (state = {}, action) => {
  switch (action.type) {
    case "SUCCEED_READ": {
      return {...state, ...action.payload.upgradeInvites};
    }
    default:
      return state;
  }
};

export default upgradeInvites;