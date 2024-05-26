import { create } from 'zustand';
import { SeasonWithProgress, TraktIds } from '../apis/Trakt';

export type ShowWithProgress = {
  addedFromSearch: boolean;
  title: string;
  ids: TraktIds;
  aired: number;
  completed: number;
  last_watched_at: string;
  reset_at: number;
  seasons: SeasonWithProgress[];
};

interface ShowsProgressStore {
  shows: ShowWithProgress[] | null;
  setShows: (shws: ShowWithProgress[]) => void;
}

export const useShowsProgressStore = create<ShowsProgressStore>((set) => ({
  shows: null,
  setShows: (shws: ShowWithProgress[]) => set(() => ({ shows: shws })),
}));