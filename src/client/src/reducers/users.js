import {mapBy} from "../components/utils"

const users = (state = {list: [], byParty: {}}, action) => {
  switch (action.type) {
    default:
      return state;
    case "SUCCEED_READ": {
      return {
        "list": action.payload.users,
        "byParty": mapBy("party")(action.payload.users)
      }
    }
  }
};
  
export default users;
