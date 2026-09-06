import { create } from 'zustand';

export const useUIStore = create((set) => ({
  composeOpen: false,
  openCompose: () => set({ composeOpen: true }),
  closeCompose: () => set({ composeOpen: false }),
}));
