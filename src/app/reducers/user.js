// user object is set server side and is never updated client side but this empty reducer is still needed
const user = (state = null, action) => {
  switch (action.type) {
    case "SKIP_UPGRADE":
      return {
        ... state,
        skippedUpgrade: true
      }
    default:
      return state;
  }
};

export default user;
