const tagsById = (state = {}, action) => {
  switch (action.type) {
    case "ADD_TAG": {
      const { boardId, tagId, name, color } = action.payload;
      
      return { ...state, [tagId]: { name, color, _id: tagId, boardId }};
    }
    case "SUCCEED_READ": {
      return {...state, ...action.payload.tagsById};
    }
    default:
      return state;
  }
};

export default tagsById;
