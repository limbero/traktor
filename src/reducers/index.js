import { ADD_SHOW } from "../actions/action-types";

const initialState = {
  shows: []
};
const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_SHOW:
      return { ...state, shows: [...state.shows, action.payload] };
    default:
      return state;
  }
};
export default rootReducer;
