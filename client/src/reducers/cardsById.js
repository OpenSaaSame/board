import merge from 'lodash/merge';

const cardsById = (state = {}, action) => {
  switch (action.type) {
    case "ADD_CARD": {
      const { cardText, cardId, boardId } = action.payload;
      return { ...state, [cardId]: { text: cardText, _id: cardId, boardId, tags: [], comments: [], assignee: null } };
    }
    case "CHANGE_CARD_TEXT": {
      const { cardText, cardId } = action.payload;
      return { ...state, [cardId]: { ...state[cardId], text: cardText } };
    }
    case "CHANGE_CARD_DATE": {
      const { date, cardId } = action.payload;
      return { ...state, [cardId]: { ...state[cardId], date } };
    }
    case "CHANGE_CARD_COLOR": {
      const { color, cardId } = action.payload;
      return { ...state, [cardId]: { ...state[cardId], color } };
    }
    case "CHANGE_CARD_ASSIGNEE": {
      const { cardId, assignee } = action.payload;
      return { ...state, [cardId]: { ...state[cardId], assignee }}
    }
    case "REMOVE_CARD_ASSIGNEE": {
      const { cardId } = action.payload;
      return { ...state, [cardId]: { ...state[cardId], assignee: undefined }}
    }
    case "DELETE_CARD": {
      const { cardId } = action.payload;
      const { [cardId]: deletedCard, ...restOfCards } = state;
      return restOfCards;
    }
    // Find every card from the deleted list and remove it (actually unnecessary since they will be removed from db on next write anyway)
    case "DELETE_LIST": {
      const { cards: cardIds } = action.payload;
      return Object.keys(state)
        .filter(cardId => !cardIds.includes(cardId))
        .reduce(
          (newState, cardId) => ({ ...newState, [cardId]: state[cardId] }),
          {}
        );
    }
    case "ADD_COMMENT": {
      const { commentId, cardId } = action.payload;
      return { ...state, [cardId]: { ...state[cardId], comments: [...state[cardId].comments, commentId] }};
    }
    case "ASSIGN_TAG": {
      const { tagId, cardId } = action.payload;
      return { ...state, [cardId]: { ...state[cardId], tags: [ ...state[cardId].tags, tagId ]}};
    }
    case "UNASSIGN_TAG": {
      const { tagId, cardId } = action.payload;
      return { ...state, [cardId]: { ...state[cardId], tags: state[cardId].tags.filter(id => id !== tagId) }};
    }
    case "SUCCEED_READ": {
      return merge({}, state, action.payload.cardsById);
    }
    default:
      return state;
  }
};

export default cardsById;
