import { mapBy } from "../components/utils"

const users = (state = { list: [], byParty: {} }, action) => {
  switch (action.type) {
    default: return state;
    case "PutProfile": {
      const { displayName, party } = action.payload;

      return {
        list: [...state.list, { displayName }],
        byParty: { ...state.byParty, [party]: { displayName } }
      }
    }
    case "SUCCEED_READ": {
      return {
        "list": action.payload.users,
        "byParty": {...state.party, ...mapBy("party")(action.payload.users)}
      }
    }
  }
};

export default users;