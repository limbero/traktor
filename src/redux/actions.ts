import { RefreshToken } from "../apis/Trakt";

export const SET_TOKEN = 'SET_TOKEN';

export const setToken = (token: RefreshToken) => ({
  type: SET_TOKEN,
  payload: token,
});
