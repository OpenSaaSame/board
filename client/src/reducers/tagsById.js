const tagsById = (state = {}, action) => {
  switch (action.type) {
    case "ADD_TAG": {
      const { boardId, tagId, name, color } = action.payload
      return { ...state, [tagId]: { name, color, _id: tagId, boardId, cards: [] }};
    }
    case "ASSIGN_TAG": {
      const { tagId, cardId } = action.payload;
      return { ...state, [tagId]: { ...state[tagId], cards: [ ...state[tagId].cards, cardId ] }};
    }
    case "UNASSIGN_TAG": {
      const { tagId, cardId } = action.payload;
      return { ...state, [tagId]: { ...state[tagId], cards: state[tagId].cards.filter(id => id !== cardId)}}
    }
    case "SUCCEED_READ": {
      return {...state, ...action.payload.tagsById};
    }
    default:
      return state;
  }
};

export default tagsById;
