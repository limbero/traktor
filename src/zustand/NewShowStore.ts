import { create } from 'zustand';
import { ZustandShowWithProgress } from './ShowsProgressStore';

interface NewShowStore {
  newShow: ZustandShowWithProgress | null;
  addNewShow: (newShow: ZustandShowWithProgress) => void;
  clearNewShow: () => void;
}

export const useNewShowStore = create<NewShowStore>((set) => ({
  newShow: null,
  addNewShow: (newShow: ZustandShowWithProgress) => set(() => ({ newShow: newShow })),
  clearNewShow: () => set(() => ({ newShow: null })),
}));