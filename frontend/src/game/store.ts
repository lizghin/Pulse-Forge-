// Game state store using Zustand

import { create } from 'zustand';
import { GameState, Upgrade } from './types';
import { UPGRADES } from './data/upgrades';

interface GameStore extends GameState {
  // Setters
  setPhase: (phase: GameState['phase']) => void;
  setTimer: (timer: number) => void;
  setDifficulty: (difficulty: number) => void;
  
  // Score & stats
  addScore: (points: number) => void;
  addShards: (amount: number) => void;
  addDistance: (dist: number) => void;
  addPerfectPulse: () => void;
  
  // Upgrades
  triggerUpgradeChoice: () => void;
  selectUpgrade: (upgrade: Upgrade) => void;
  
  // Game lifecycle
  startGame: () => void;
  resetGame: () => void;
  
  // Multiplier
  setMultiplier: (mult: number) => void;
}

const INITIAL_STATE: GameState = {
  phase: 'menu',
  timer: 90,
  maxTime: 90,
  score: 0,
  shards: 0,
  perfectPulses: 0,
  distance: 0,
  difficulty: 1,
  upgradeChoices: [],
  selectedUpgrades: [],
  lastUpgradeTime: 0,
  upgradeInterval: 15,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL_STATE,
  
  setPhase: (phase) => set({ phase }),
  setTimer: (timer) => set({ timer }),
  setDifficulty: (difficulty) => set({ difficulty }),
  
  addScore: (points) => set((state) => ({ score: state.score + Math.floor(points) })),
  addShards: (amount) => set((state) => ({ shards: state.shards + amount })),
  addDistance: (dist) => set((state) => ({ distance: state.distance + dist })),
  addPerfectPulse: () => set((state) => ({ perfectPulses: state.perfectPulses + 1 })),
  
  triggerUpgradeChoice: () => {
    const state = get();
    // Pick 3 random upgrades
    const available = UPGRADES.filter(
      (u) => !state.selectedUpgrades.find((s) => s.id === u.id)
    );
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const choices = shuffled.slice(0, 3);
    
    set({
      phase: 'upgrade',
      upgradeChoices: choices,
      lastUpgradeTime: state.maxTime - state.timer,
    });
  },
  
  selectUpgrade: (upgrade) => {
    set((state) => ({
      phase: 'playing',
      selectedUpgrades: [...state.selectedUpgrades, upgrade],
      upgradeChoices: [],
    }));
  },
  
  startGame: () => set({
    ...INITIAL_STATE,
    phase: 'countdown',
  }),
  
  resetGame: () => set(INITIAL_STATE),
  
  setMultiplier: (mult) => set({ multiplier: mult } as any),
}));
