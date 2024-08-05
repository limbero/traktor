import { createStore } from 'zustand/vanilla';
import { Token } from '../apis/Trakt';

interface TokenStore {
  token: Token | null;
  setToken: (tk: Token) => void;
}

const tokenStore = createStore<TokenStore>((set) => ({
  token: null,
  setToken: (tk: Token) => set(() => ({ token: tk })),
}));

export default tokenStore;