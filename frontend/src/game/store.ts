// Game state store using Zustand with Mastery System

import { create } from 'zustand';
import { GameState, Upgrade, MasteryStats, MasteryEvent, PersistentMastery } from './types';
import { getAvailableUpgrades, ALL_UPGRADES } from './data/upgrades';
import { 
  loadMasteryData, 
  saveMasteryData, 
  calculateRunMasteryXP, 
  checkUnlocks,
  getMasteryLevel 
} from './mastery';

interface GameStore extends GameState {
  // Persistent mastery
  persistentMastery: PersistentMastery;
  newUnlocks: string[];
  
  // Setters
  setPhase: (phase: GameState['phase']) => void;
  setTimer: (timer: number) => void;
  setDifficulty: (difficulty: number) => void;
  
  // Score & stats
  addScore: (points: number) => void;
  addShards: (amount: number) => void;
  addDistance: (dist: number) => void;
  addPerfectPulse: () => void;
  
  // Mastery tracking
  addNearMiss: () => void;
  addPhaseThrough: () => void;
  updateRhythmStreak: (isGoodTiming: boolean) => void;
  addLowHpTime: (time: number) => void;
  addMasteryEvent: (event: Omit<MasteryEvent, 'id' | 'timestamp'>) => void;
  
  // Upgrades
  triggerUpgradeChoice: () => void;
  selectUpgrade: (upgrade: Upgrade) => void;
  
  // Game lifecycle
  startGame: () => void;
  resetGame: () => void;
  endRun: () => Promise<void>;
  
  // Multiplier
  setMultiplier: (mult: number) => void;
  
  // Mastery
  loadMastery: () => Promise<void>;
}

const createInitialMasteryStats = (): MasteryStats => ({
  perfectPulses: 0,
  rhythmStreak: 0,
  maxRhythmStreak: 0,
  nearMisses: 0,
  lowHpSurvivalTime: 0,
  phaseThroughs: 0,
  categoriesUsed: new Set<string>(),
  upgradesSynergized: 0,
});

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
  masteryStats: createInitialMasteryStats(),
  recentEvents: [],
};

const DEFAULT_PERSISTENT: PersistentMastery = {
  progress: { timing: 0, risk: 0, build: 0 },
  totalRuns: 0,
  highScore: 0,
  unlockedUpgrades: [],
  unlockedCosmetics: [],
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL_STATE,
  persistentMastery: DEFAULT_PERSISTENT,
  newUnlocks: [],
  
  setPhase: (phase) => set({ phase }),
  setTimer: (timer) => set({ timer }),
  setDifficulty: (difficulty) => set({ difficulty }),
  
  addScore: (points) => set((state) => ({ score: state.score + Math.floor(points) })),
  addShards: (amount) => set((state) => ({ shards: state.shards + amount })),
  addDistance: (dist) => set((state) => ({ distance: state.distance + dist })),
  
  addPerfectPulse: () => set((state) => {
    const newStats = { ...state.masteryStats };
    newStats.perfectPulses++;
    
    // Add event
    const newEvent: MasteryEvent = {
      id: `pp_${Date.now()}`,
      type: 'perfect_pulse',
      timestamp: Date.now(),
      value: 1,
    };
    
    return { 
      perfectPulses: state.perfectPulses + 1,
      masteryStats: newStats,
      recentEvents: [...state.recentEvents.slice(-10), newEvent],
    };
  }),
  
  addNearMiss: () => set((state) => {
    const newStats = { ...state.masteryStats };
    newStats.nearMisses++;
    
    const newEvent: MasteryEvent = {
      id: `nm_${Date.now()}`,
      type: 'near_miss',
      timestamp: Date.now(),
      value: 1,
    };
    
    return {
      masteryStats: newStats,
      recentEvents: [...state.recentEvents.slice(-10), newEvent],
    };
  }),
  
  addPhaseThrough: () => set((state) => {
    const newStats = { ...state.masteryStats };
    newStats.phaseThroughs++;
    
    const newEvent: MasteryEvent = {
      id: `pt_${Date.now()}`,
      type: 'phase_through',
      timestamp: Date.now(),
      value: 1,
    };
    
    return {
      masteryStats: newStats,
      recentEvents: [...state.recentEvents.slice(-10), newEvent],
    };
  }),
  
  updateRhythmStreak: (isGoodTiming: boolean) => set((state) => {
    const newStats = { ...state.masteryStats };
    
    if (isGoodTiming) {
      newStats.rhythmStreak++;
      newStats.maxRhythmStreak = Math.max(newStats.maxRhythmStreak, newStats.rhythmStreak);
      
      // Add event for milestones
      if (newStats.rhythmStreak === 3 || newStats.rhythmStreak === 5 || newStats.rhythmStreak === 10) {
        const newEvent: MasteryEvent = {
          id: `rs_${Date.now()}`,
          type: 'rhythm_streak',
          timestamp: Date.now(),
          value: newStats.rhythmStreak,
        };
        return {
          masteryStats: newStats,
          recentEvents: [...state.recentEvents.slice(-10), newEvent],
        };
      }
    } else {
      newStats.rhythmStreak = 0;
    }
    
    return { masteryStats: newStats };
  }),
  
  addLowHpTime: (time: number) => set((state) => {
    const newStats = { ...state.masteryStats };
    newStats.lowHpSurvivalTime += time;
    
    // Milestone events
    const prev = state.masteryStats.lowHpSurvivalTime;
    const curr = newStats.lowHpSurvivalTime;
    
    if ((prev < 10 && curr >= 10) || (prev < 30 && curr >= 30)) {
      const newEvent: MasteryEvent = {
        id: `lhp_${Date.now()}`,
        type: 'low_hp_bonus',
        timestamp: Date.now(),
        value: Math.floor(curr),
      };
      return {
        masteryStats: newStats,
        recentEvents: [...state.recentEvents.slice(-10), newEvent],
      };
    }
    
    return { masteryStats: newStats };
  }),
  
  addMasteryEvent: (event) => set((state) => ({
    recentEvents: [...state.recentEvents.slice(-10), {
      ...event,
      id: `${event.type}_${Date.now()}`,
      timestamp: Date.now(),
    }],
  })),
  
  triggerUpgradeChoice: () => {
    const state = get();
    const availableUpgrades = getAvailableUpgrades(state.persistentMastery.unlockedUpgrades);
    
    // Pick 3 random upgrades not already selected
    const available = availableUpgrades.filter(
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
    set((state) => {
      const newStats = { ...state.masteryStats };
      newStats.categoriesUsed = new Set([...state.masteryStats.categoriesUsed, upgrade.category]);
      
      // Check for synergy (multiple upgrades in same category)
      const sameCategoryCount = state.selectedUpgrades.filter(u => u.category === upgrade.category).length;
      if (sameCategoryCount > 0) {
        newStats.upgradesSynergized++;
      }
      
      // Category bonus event
      if (newStats.categoriesUsed.size === 5) {
        const newEvent: MasteryEvent = {
          id: `cb_${Date.now()}`,
          type: 'category_bonus',
          timestamp: Date.now(),
          value: 5,
        };
        return {
          phase: 'playing',
          selectedUpgrades: [...state.selectedUpgrades, upgrade],
          upgradeChoices: [],
          masteryStats: newStats,
          recentEvents: [...state.recentEvents.slice(-10), newEvent],
        };
      }
      
      return {
        phase: 'playing',
        selectedUpgrades: [...state.selectedUpgrades, upgrade],
        upgradeChoices: [],
        masteryStats: newStats,
      };
    });
  },
  
  startGame: () => set({
    ...INITIAL_STATE,
    phase: 'countdown',
    masteryStats: createInitialMasteryStats(),
    recentEvents: [],
    persistentMastery: get().persistentMastery,
    newUnlocks: [],
  }),
  
  resetGame: () => set((state) => ({
    ...INITIAL_STATE,
    persistentMastery: state.persistentMastery,
    newUnlocks: [],
  })),
  
  endRun: async () => {
    const state = get();
    const xpGained = calculateRunMasteryXP(state.masteryStats);
    
    // Update persistent mastery
    const newMastery = { ...state.persistentMastery };
    newMastery.progress.timing += xpGained.timing;
    newMastery.progress.risk += xpGained.risk;
    newMastery.progress.build += xpGained.build;
    newMastery.totalRuns++;
    newMastery.highScore = Math.max(newMastery.highScore, state.score);
    
    // Check for new unlocks
    const unlocks = checkUnlocks(newMastery);
    newMastery.unlockedUpgrades = [...newMastery.unlockedUpgrades, ...unlocks];
    
    // Save to storage
    await saveMasteryData(newMastery);
    
    set({
      persistentMastery: newMastery,
      newUnlocks: unlocks,
    });
  },
  
  setMultiplier: (mult) => set({ multiplier: mult } as any),
  
  loadMastery: async () => {
    const mastery = await loadMasteryData();
    set({ persistentMastery: mastery });
  },
}));
