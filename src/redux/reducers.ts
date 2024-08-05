import { Token } from '../apis/Trakt';
import { SET_TOKEN } from './actions';

const initialState: TokenState = {
  token: null,
};

export type TokenState = {
  token: Token | null;
};

type Action = {
  type: string;
  payload: Token;
};
const rootReducer = (state = initialState, action: Action): TokenState => {
  switch (action.type) {
    case SET_TOKEN:
      return {
        ...state,
        token: action.payload,
      };
    default:
      return state;
  }
};
export default rootReducer;
