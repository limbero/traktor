import { create } from 'zustand';
import { Token } from '../apis/Trakt';

interface TokenStore {
  token: Token | null;
  setToken: (tk: Token) => void;
}

export const useTokenStore = create<TokenStore>((set) => ({
  token: null,
  setToken: (tk: Token) => set(() => ({ token: tk })),
}));