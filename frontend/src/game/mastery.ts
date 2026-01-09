// Mastery System - Skill-based progression

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MasteryProgress, MasteryStats, PersistentMastery, Upgrade } from './types';

const MASTERY_STORAGE_KEY = '@pulse_forge_mastery';

// Mastery level thresholds (XP needed for each level 1-10)
export const MASTERY_THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000];

// XP rewards for actions
export const MASTERY_XP = {
  // Timing
  perfectPulse: 10,
  rhythmStreak3: 25,
  rhythmStreak5: 50,
  rhythmStreak10: 100,
  
  // Risk
  nearMiss: 15,
  phaseThroughHazard: 20,
  lowHpSurvival10s: 30,
  lowHpSurvival30s: 100,
  
  // Build
  uniqueCategory: 20,
  allCategories: 150,
  synergyCombo: 40,
};

// Get mastery level from XP
export function getMasteryLevel(xp: number): number {
  for (let i = MASTERY_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= MASTERY_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

// Get progress to next level (0-1)
export function getMasteryProgressToNext(xp: number): number {
  const level = getMasteryLevel(xp);
  if (level >= 10) return 1;
  
  const currentThreshold = MASTERY_THRESHOLDS[level - 1];
  const nextThreshold = MASTERY_THRESHOLDS[level];
  
  return (xp - currentThreshold) / (nextThreshold - currentThreshold);
}

// Calculate mastery XP earned from a run
export function calculateRunMasteryXP(stats: MasteryStats): { timing: number; risk: number; build: number } {
  let timing = 0;
  let risk = 0;
  let build = 0;
  
  // Timing XP
  timing += stats.perfectPulses * MASTERY_XP.perfectPulse;
  if (stats.maxRhythmStreak >= 3) timing += MASTERY_XP.rhythmStreak3;
  if (stats.maxRhythmStreak >= 5) timing += MASTERY_XP.rhythmStreak5;
  if (stats.maxRhythmStreak >= 10) timing += MASTERY_XP.rhythmStreak10;
  
  // Risk XP
  risk += stats.nearMisses * MASTERY_XP.nearMiss;
  risk += stats.phaseThroughs * MASTERY_XP.phaseThroughHazard;
  if (stats.lowHpSurvivalTime >= 10) risk += MASTERY_XP.lowHpSurvival10s;
  if (stats.lowHpSurvivalTime >= 30) risk += MASTERY_XP.lowHpSurvival30s;
  
  // Build XP
  const categoriesCount = stats.categoriesUsed.size;
  build += categoriesCount * MASTERY_XP.uniqueCategory;
  if (categoriesCount >= 5) build += MASTERY_XP.allCategories;
  build += stats.upgradesSynergized * MASTERY_XP.synergyCombo;
  
  return { timing, risk, build };
}

// Default persistent mastery data
const DEFAULT_MASTERY: PersistentMastery = {
  progress: { timing: 0, risk: 0, build: 0 },
  totalRuns: 0,
  highScore: 0,
  unlockedUpgrades: [],
  unlockedCosmetics: [],
};

// Load mastery data from storage
export async function loadMasteryData(): Promise<PersistentMastery> {
  try {
    const data = await AsyncStorage.getItem(MASTERY_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return { ...DEFAULT_MASTERY, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load mastery data:', error);
  }
  return { ...DEFAULT_MASTERY };
}

// Save mastery data to storage
export async function saveMasteryData(data: PersistentMastery): Promise<void> {
  try {
    await AsyncStorage.setItem(MASTERY_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save mastery data:', error);
  }
}

// Check for new unlocks based on mastery levels
export function checkUnlocks(mastery: PersistentMastery): string[] {
  const newUnlocks: string[] = [];
  
  const timingLevel = getMasteryLevel(mastery.progress.timing);
  const riskLevel = getMasteryLevel(mastery.progress.risk);
  const buildLevel = getMasteryLevel(mastery.progress.build);
  
  // Timing unlocks
  if (timingLevel >= 2 && !mastery.unlockedUpgrades.includes('tempo_surge')) {
    newUnlocks.push('tempo_surge');
  }
  if (timingLevel >= 4 && !mastery.unlockedUpgrades.includes('perfect_flow')) {
    newUnlocks.push('perfect_flow');
  }
  if (timingLevel >= 6 && !mastery.unlockedUpgrades.includes('rhythm_master')) {
    newUnlocks.push('rhythm_master');
  }
  
  // Risk unlocks
  if (riskLevel >= 2 && !mastery.unlockedUpgrades.includes('close_call')) {
    newUnlocks.push('close_call');
  }
  if (riskLevel >= 4 && !mastery.unlockedUpgrades.includes('danger_zone')) {
    newUnlocks.push('danger_zone');
  }
  if (riskLevel >= 6 && !mastery.unlockedUpgrades.includes('death_defier')) {
    newUnlocks.push('death_defier');
  }
  
  // Build unlocks
  if (buildLevel >= 2 && !mastery.unlockedUpgrades.includes('versatile')) {
    newUnlocks.push('versatile');
  }
  if (buildLevel >= 4 && !mastery.unlockedUpgrades.includes('synergy_core')) {
    newUnlocks.push('synergy_core');
  }
  
  // Combined mastery unlocks (relics)
  const totalLevel = timingLevel + riskLevel + buildLevel;
  if (totalLevel >= 12 && !mastery.unlockedUpgrades.includes('pulse_virtuoso')) {
    newUnlocks.push('pulse_virtuoso');
  }
  if (totalLevel >= 18 && !mastery.unlockedUpgrades.includes('forge_master')) {
    newUnlocks.push('forge_master');
  }
  
  return newUnlocks;
}

// Mastery track descriptions
export const MASTERY_TRACKS = {
  timing: {
    name: 'Timing Mastery',
    description: 'Perfect pulses & rhythm streaks',
    icon: 'flash',
    color: '#ffaa00',
  },
  risk: {
    name: 'Risk Mastery',
    description: 'Near-misses & low-HP survival',
    icon: 'flame',
    color: '#ff4444',
  },
  build: {
    name: 'Build Mastery',
    description: 'Diverse upgrades & synergies',
    icon: 'construct',
    color: '#00aaff',
  },
};
