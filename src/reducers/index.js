import {
  ADD_SHOW,
  SET_TOKEN
} from "../actions/action-types";

const initialState = {
  shows: [],
  token: null
};
const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_SHOW:
      return { ...state,
        shows: [...state.shows, action.payload]
      };
    case SET_TOKEN:
      return { ...state,
        token: action.payload
      };
    default:
      return state;
  }
};
export default rootReducer;
