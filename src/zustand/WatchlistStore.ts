import { create } from 'zustand';
import { WatchlistItem } from '../apis/Trakt';

interface WatchlistStore {
  watchlist: WatchlistItem[] | null;
  setWatchlist: (wl: WatchlistItem[]) => void;
}

export const useWatchlistStore = create<WatchlistStore>((set) => ({
  watchlist: null,
  setWatchlist: (wl: WatchlistItem[]) => set(() => ({ watchlist: wl })),
}));