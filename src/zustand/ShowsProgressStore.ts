import { create } from 'zustand';
import { SeasonWithProgress, TraktIds } from '../apis/Trakt';
import { StreamingLocation } from '../apis/TraktorStreaming';

export type ZustandShowWithProgress = {
  addedFromSearchOrWatchlist?: boolean;
  title: string;
  ids: TraktIds;
  aired: number;
  completed: number;
  last_watched_at: string;
  reset_at: number;
  seasons: SeasonWithProgress[];
  next_episode?: {
    season: number;
    number: number;
    title: string;
    ids: TraktIds;
  };
  streaming_locations?: StreamingLocation[];
  runtime?: number;
};

interface ShowsProgressStore {
  shows: ZustandShowWithProgress[] | null;
  setShows: (shws: ZustandShowWithProgress[]) => void;
  prependShow: (shw: ZustandShowWithProgress) => void;
  updateShow: (shw: ZustandShowWithProgress) => void;
}

export const useShowsProgressStore = create<ShowsProgressStore>((set) => ({
  shows: null,
  setShows: (shws: ZustandShowWithProgress[]) => set(() => ({ shows: shws })),
  prependShow: (shw: ZustandShowWithProgress) => set((state) => {
    if (state.shows === null) { return state; }
    return { shows: [shw, ...state.shows] };
  }),
  updateShow: (shw: ZustandShowWithProgress) => set((state) => {
    if (state.shows === null) { return state; }
    const newShows = [...state.shows];
    const indexToReplace = newShows.findIndex(oldShow => oldShow.ids.trakt === shw.ids.trakt);
    if (indexToReplace === -1) { return state; }
    newShows[indexToReplace] = shw;
    return { shows: newShows };
  }),
}));