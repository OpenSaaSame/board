const commentsById = (state = {}, action) => {
  switch (action.type) {
    case "ADD_COMMENT": {
      const { cardId, commentId, comment } = action.payload;
      return { ...state, [commentId]: { body: comment, _id: commentId, cardId } };
    }
    case "SUCCEED_READ": {
      return action.payload.commentsById;
    }
    default:
      return state;
  }
};

export default commentsById;
