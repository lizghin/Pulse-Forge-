// Mastery System with Blueprints Economy
// 
// TUNING PARAMETERS:
// ==================
// MASTERY THRESHOLDS: XP needed per level (1-10)
// BLUEPRINT ECONOMY: Base + mastery bonuses per run
// UNLOCK COSTS: Blueprints needed for each item

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MasteryProgress, MasteryStats, PersistentMastery, RunRewards, CosmeticSkin, HazardTheme } from './types';

const MASTERY_STORAGE_KEY = '@pulse_forge_mastery_v2';

// ============================================
// MASTERY LEVEL THRESHOLDS
// ============================================
// XP needed for each level 1-10
export const MASTERY_THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000];

// ============================================
// XP REWARDS FOR ACTIONS
// ============================================
export const MASTERY_XP = {
  // Timing Mastery
  perfectPulse: 10,
  rhythmStreak3: 25,
  rhythmStreak5: 50,
  rhythmStreak10: 100,
  rhythmStreak20: 200,
  
  // Risk Mastery
  nearMiss: 15,
  phaseThroughHazard: 20,
  lowHpSurvival10s: 30,
  lowHpSurvival30s: 100,
  
  // Build Mastery
  uniqueCategory: 20,
  allCategories: 150,
  synergyCombo: 40,
};

// ============================================
// BLUEPRINT ECONOMY
// ============================================
export const BLUEPRINT_REWARDS = {
  // Base reward from score
  basePerScore: 0.1, // 1 blueprint per 10 score
  minBase: 5,        // Minimum 5 blueprints per run
  
  // Mastery bonuses (added to base)
  timingBonusPerPerfect: 2,
  timingStreakBonus5: 10,
  timingStreakBonus10: 25,
  timingStreakBonus20: 50,
  
  riskBonusPerNearMiss: 3,
  riskLowHpBonus10s: 15,
  riskLowHpBonus30s: 40,
  
  buildBonusPerCategory: 5,
  buildAllCategoriesBonus: 30,
  buildSynergyBonus: 10,
};

// ============================================
// UNLOCK COSTS (Blueprints)
// ============================================
export const UNLOCK_COSTS = {
  // Upgrades by rarity
  commonUpgrade: 50,
  rareUpgrade: 150,
  legendaryUpgrade: 400,
  
  // Cosmetics
  basicSkin: 100,
  premiumSkin: 300,
  
  // Themes
  hazardTheme: 200,
};

// ============================================
// COSMETIC SKINS
// ============================================
export const COSMETIC_SKINS: CosmeticSkin[] = [
  {
    id: 'default',
    name: 'Core',
    description: 'Standard pulse core',
    coreColor: '#00ffff',
    glowColor: '#00ffff',
    phaseColor: '#ff00ff',
    blueprintCost: 0,
  },
  {
    id: 'ember',
    name: 'Ember',
    description: 'Fiery orange glow',
    coreColor: '#ff6600',
    glowColor: '#ff4400',
    phaseColor: '#ffaa00',
    blueprintCost: 100,
  },
  {
    id: 'toxic',
    name: 'Toxic',
    description: 'Radioactive green',
    coreColor: '#00ff44',
    glowColor: '#44ff00',
    phaseColor: '#88ff00',
    blueprintCost: 100,
  },
  {
    id: 'void',
    name: 'Void',
    description: 'Deep purple darkness',
    coreColor: '#8800ff',
    glowColor: '#6600cc',
    phaseColor: '#cc00ff',
    blueprintCost: 150,
  },
  {
    id: 'gold',
    name: 'Golden',
    description: 'Prestigious gold',
    coreColor: '#ffd700',
    glowColor: '#ffaa00',
    phaseColor: '#ffffff',
    blueprintCost: 300,
  },
];

// ============================================
// HAZARD THEMES
// ============================================
export const HAZARD_THEMES: HazardTheme[] = [
  {
    id: 'default',
    name: 'Neon',
    description: 'Classic neon hazards',
    wallColor: '#ff4444',
    droneColor: '#ff6600',
    laserColor: '#ff0044',
    blueprintCost: 0,
  },
  {
    id: 'ice',
    name: 'Frozen',
    description: 'Icy blue hazards',
    wallColor: '#44aaff',
    droneColor: '#66ccff',
    laserColor: '#00aaff',
    blueprintCost: 200,
  },
  {
    id: 'nature',
    name: 'Overgrowth',
    description: 'Organic green hazards',
    wallColor: '#44aa44',
    droneColor: '#66cc66',
    laserColor: '#00ff44',
    blueprintCost: 200,
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getMasteryLevel(xp: number): number {
  for (let i = MASTERY_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= MASTERY_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getMasteryProgressToNext(xp: number): number {
  const level = getMasteryLevel(xp);
  if (level >= 10) return 1;
  
  const currentThreshold = MASTERY_THRESHOLDS[level - 1];
  const nextThreshold = MASTERY_THRESHOLDS[level];
  
  return (xp - currentThreshold) / (nextThreshold - currentThreshold);
}

export function calculateRunMasteryXP(stats: MasteryStats): { timing: number; risk: number; build: number } {
  let timing = 0;
  let risk = 0;
  let build = 0;
  
  // Timing XP
  timing += stats.perfectPulses * MASTERY_XP.perfectPulse;
  if (stats.maxRhythmStreak >= 3) timing += MASTERY_XP.rhythmStreak3;
  if (stats.maxRhythmStreak >= 5) timing += MASTERY_XP.rhythmStreak5;
  if (stats.maxRhythmStreak >= 10) timing += MASTERY_XP.rhythmStreak10;
  if (stats.maxRhythmStreak >= 20) timing += MASTERY_XP.rhythmStreak20;
  
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

// Calculate blueprints earned from a run
export function calculateRunBlueprints(score: number, stats: MasteryStats): RunRewards {
  // Base blueprints from score
  const baseBlueprints = Math.max(
    BLUEPRINT_REWARDS.minBase,
    Math.floor(score * BLUEPRINT_REWARDS.basePerScore)
  );
  
  // Timing bonus
  let timingBonus = stats.perfectPulses * BLUEPRINT_REWARDS.timingBonusPerPerfect;
  if (stats.maxRhythmStreak >= 5) timingBonus += BLUEPRINT_REWARDS.timingStreakBonus5;
  if (stats.maxRhythmStreak >= 10) timingBonus += BLUEPRINT_REWARDS.timingStreakBonus10;
  if (stats.maxRhythmStreak >= 20) timingBonus += BLUEPRINT_REWARDS.timingStreakBonus20;
  
  // Risk bonus
  let riskBonus = stats.nearMisses * BLUEPRINT_REWARDS.riskBonusPerNearMiss;
  if (stats.lowHpSurvivalTime >= 10) riskBonus += BLUEPRINT_REWARDS.riskLowHpBonus10s;
  if (stats.lowHpSurvivalTime >= 30) riskBonus += BLUEPRINT_REWARDS.riskLowHpBonus30s;
  
  // Build bonus
  const categoriesCount = stats.categoriesUsed.size;
  let buildBonus = categoriesCount * BLUEPRINT_REWARDS.buildBonusPerCategory;
  if (categoriesCount >= 5) buildBonus += BLUEPRINT_REWARDS.buildAllCategoriesBonus;
  buildBonus += stats.upgradesSynergized * BLUEPRINT_REWARDS.buildSynergyBonus;
  
  return {
    baseBlueprints,
    timingBonus,
    riskBonus,
    buildBonus,
    totalBlueprints: baseBlueprints + timingBonus + riskBonus + buildBonus,
  };
}

// ============================================
// PERSISTENCE
// ============================================

const DEFAULT_MASTERY: PersistentMastery = {
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

export async function saveMasteryData(data: PersistentMastery): Promise<void> {
  try {
    await AsyncStorage.setItem(MASTERY_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save mastery data:', error);
  }
}

// Check for new mastery-based unlocks
export function checkMasteryUnlocks(mastery: PersistentMastery): string[] {
  const newUnlocks: string[] = [];
  
  const timingLevel = getMasteryLevel(mastery.progress.timing);
  const riskLevel = getMasteryLevel(mastery.progress.risk);
  const buildLevel = getMasteryLevel(mastery.progress.build);
  
  // Timing unlocks
  if (timingLevel >= 2 && !mastery.unlockedUpgrades.includes('tempo_surge')) {
    newUnlocks.push('tempo_surge');
  }
  if (timingLevel >= 3 && !mastery.unlockedUpgrades.includes('pulse_memory')) {
    newUnlocks.push('pulse_memory');
  }
  if (timingLevel >= 4 && !mastery.unlockedUpgrades.includes('perfect_flow')) {
    newUnlocks.push('perfect_flow');
  }
  if (timingLevel >= 5 && !mastery.unlockedUpgrades.includes('streak_shield')) {
    newUnlocks.push('streak_shield');
  }
  if (timingLevel >= 6 && !mastery.unlockedUpgrades.includes('rhythm_master')) {
    newUnlocks.push('rhythm_master');
  }
  
  // Risk unlocks
  if (riskLevel >= 2 && !mastery.unlockedUpgrades.includes('close_call')) {
    newUnlocks.push('close_call');
  }
  if (riskLevel >= 3 && !mastery.unlockedUpgrades.includes('adrenaline_rush')) {
    newUnlocks.push('adrenaline_rush');
  }
  if (riskLevel >= 4 && !mastery.unlockedUpgrades.includes('danger_zone')) {
    newUnlocks.push('danger_zone');
  }
  if (riskLevel >= 5 && !mastery.unlockedUpgrades.includes('last_stand')) {
    newUnlocks.push('last_stand');
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
