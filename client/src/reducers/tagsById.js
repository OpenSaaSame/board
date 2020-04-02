const tagsById = (state = {}, action) => {
  switch (action.type) {
    case "ADD_TAG": {
      const { boardId, tagId, name, color } = action.payload;
      
      return { ...state, [tagId]: { name, color, _id: tagId, boardId }};
    }
    case "SUCCEED_READ": {
      return {...action.payload.tagsById, ...state};
    }
    default:
      return state;
  }
};

export default tagsById;
