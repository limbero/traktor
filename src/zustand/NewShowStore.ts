import { create } from 'zustand';
import { ShowWithProgress } from './ShowsProgressStore';

interface NewShowStore {
  newShow: ShowWithProgress | null;
  addNewShow: (newShow: ShowWithProgress) => void;
  clearNewShow: () => void;
}

export const useNewShowStore = create<NewShowStore>((set) => ({
  newShow: null,
  addNewShow: (newShow: ShowWithProgress) => set(() => ({ newShow: newShow })),
  clearNewShow: () => set(() => ({ newShow: null })),
}));