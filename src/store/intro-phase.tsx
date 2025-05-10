import { create } from 'zustand';

export type Phase = 'loader' | 'intro' | 'hero';

interface PhaseState {
  phase: Phase;
  setPhase: (p: Phase) => void;
}

export const usePhase = create<PhaseState>((set) => ({
  phase: 'loader',
  setPhase: (phase) => set({ phase }),
}));
