// Game state store with Blueprints Meta-Progression

import { create } from 'zustand';
import { GameState, Upgrade, MasteryStats, MasteryEvent, PersistentMastery, RunRewards } from './types';
import Analytics from '../analytics';
import { getAvailableUpgrades, ALL_UPGRADES } from './data/upgrades';
import { 
  loadMasteryData, 
  saveMasteryData, 
  calculateRunMasteryXP, 
  calculateRunBlueprints,
  checkMasteryUnlocks,
  getMasteryLevel,
  COSMETIC_SKINS,
  HAZARD_THEMES,
} from './mastery';

interface GameStore extends GameState {
  // Persistent mastery & blueprints
  persistentMastery: PersistentMastery;
  newUnlocks: string[];
  runRewards: RunRewards | null;
  
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
  
  // Mastery & Blueprints
  loadMastery: () => Promise<void>;
  purchaseUpgrade: (upgradeId: string, cost: number) => Promise<boolean>;
  purchaseCosmetic: (cosmeticId: string, cost: number) => Promise<boolean>;
  purchaseTheme: (themeId: string, cost: number) => Promise<boolean>;
  selectSkin: (skinId: string) => Promise<void>;
  selectTheme: (themeId: string) => Promise<void>;
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
  blueprints: 0,
  unlockedUpgrades: [],
  unlockedCosmetics: ['default'],
  unlockedThemes: ['default'],
  selectedSkin: 'default',
  selectedTheme: 'default',
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL_STATE,
  persistentMastery: DEFAULT_PERSISTENT,
  newUnlocks: [],
  runRewards: null,
  
  setPhase: (phase) => set({ phase }),
  setTimer: (timer) => set({ timer }),
  setDifficulty: (difficulty) => set({ difficulty }),
  
  addScore: (points) => set((state) => ({ score: state.score + Math.floor(points) })),
  addShards: (amount) => set((state) => ({ shards: state.shards + amount })),
  addDistance: (dist) => set((state) => ({ distance: state.distance + dist })),
  
  addPerfectPulse: () => set((state) => {
    const newStats = { ...state.masteryStats };
    newStats.perfectPulses++;
    
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
      
      if (newStats.rhythmStreak === 3 || newStats.rhythmStreak === 5 || 
          newStats.rhythmStreak === 10 || newStats.rhythmStreak === 20) {
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
      
      const sameCategoryCount = state.selectedUpgrades.filter(u => u.category === upgrade.category).length;
      if (sameCategoryCount > 0) {
        newStats.upgradesSynergized++;
      }
      
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
    runRewards: null,
  }),
  
  resetGame: () => set((state) => ({
    ...INITIAL_STATE,
    persistentMastery: state.persistentMastery,
    newUnlocks: [],
    runRewards: null,
  })),
  
  endRun: async () => {
    const state = get();
    
    // Calculate XP
    const xpGained = calculateRunMasteryXP(state.masteryStats);
    
    // Calculate Blueprints
    const rewards = calculateRunBlueprints(state.score, state.masteryStats);
    
    // Update persistent mastery
    const newMastery = { ...state.persistentMastery };
    newMastery.progress.timing += xpGained.timing;
    newMastery.progress.risk += xpGained.risk;
    newMastery.progress.build += xpGained.build;
    newMastery.totalRuns++;
    newMastery.highScore = Math.max(newMastery.highScore, state.score);
    newMastery.blueprints += rewards.totalBlueprints;
    
    // Check for new mastery unlocks
    const unlocks = checkMasteryUnlocks(newMastery);
    newMastery.unlockedUpgrades = [...newMastery.unlockedUpgrades, ...unlocks];
    
    // Track run end analytics
    Analytics.trackRunEnd({
      score: state.score,
      duration: state.maxTime - state.timer,
      segment_reached: Math.floor(state.distance / 100),
      death_cause: state.phase === 'gameOver' ? 'collision' : null,
      perfect_count: state.perfectPulses,
      near_miss_count: state.masteryStats.nearMisses,
      blueprints_earned_total: rewards.totalBlueprints,
    });
    
    // End analytics run
    Analytics.endRun();
    
    // Save to storage
    await saveMasteryData(newMastery);
    
    set({
      persistentMastery: newMastery,
      newUnlocks: unlocks,
      runRewards: rewards,
    });
  },
  
  setMultiplier: (mult) => set({ multiplier: mult } as any),
  
  loadMastery: async () => {
    const mastery = await loadMasteryData();
    set({ persistentMastery: mastery });
  },
  
  purchaseUpgrade: async (upgradeId: string, cost: number) => {
    const state = get();
    if (state.persistentMastery.blueprints < cost) return false;
    if (state.persistentMastery.unlockedUpgrades.includes(upgradeId)) return false;
    
    const newMastery = { ...state.persistentMastery };
    newMastery.blueprints -= cost;
    newMastery.unlockedUpgrades = [...newMastery.unlockedUpgrades, upgradeId];
    
    await saveMasteryData(newMastery);
    set({ persistentMastery: newMastery });
    return true;
  },
  
  purchaseCosmetic: async (cosmeticId: string, cost: number) => {
    const state = get();
    if (state.persistentMastery.blueprints < cost) return false;
    if (state.persistentMastery.unlockedCosmetics.includes(cosmeticId)) return false;
    
    const newMastery = { ...state.persistentMastery };
    newMastery.blueprints -= cost;
    newMastery.unlockedCosmetics = [...newMastery.unlockedCosmetics, cosmeticId];
    
    await saveMasteryData(newMastery);
    set({ persistentMastery: newMastery });
    return true;
  },
  
  purchaseTheme: async (themeId: string, cost: number) => {
    const state = get();
    if (state.persistentMastery.blueprints < cost) return false;
    if (state.persistentMastery.unlockedThemes.includes(themeId)) return false;
    
    const newMastery = { ...state.persistentMastery };
    newMastery.blueprints -= cost;
    newMastery.unlockedThemes = [...newMastery.unlockedThemes, themeId];
    
    await saveMasteryData(newMastery);
    set({ persistentMastery: newMastery });
    return true;
  },
  
  selectSkin: async (skinId: string) => {
    const state = get();
    if (!state.persistentMastery.unlockedCosmetics.includes(skinId)) return;
    
    const newMastery = { ...state.persistentMastery, selectedSkin: skinId };
    await saveMasteryData(newMastery);
    set({ persistentMastery: newMastery });
  },
  
  selectTheme: async (themeId: string) => {
    const state = get();
    if (!state.persistentMastery.unlockedThemes.includes(themeId)) return;
    
    const newMastery = { ...state.persistentMastery, selectedTheme: themeId };
    await saveMasteryData(newMastery);
    set({ persistentMastery: newMastery });
  },
}));
