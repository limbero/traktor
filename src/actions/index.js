import { ADD_SHOW, SET_TOKEN } from "./action-types";

export const addShow = show => ({ type: ADD_SHOW, payload: show });
export const setToken = token => ({ type: SET_TOKEN, payload: token });
