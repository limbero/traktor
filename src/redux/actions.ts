import { Token } from "../apis/Trakt";

export const SET_TOKEN = 'SET_TOKEN';

export const setToken = (token: Token) => ({
  type: SET_TOKEN,
  payload: token,
});
