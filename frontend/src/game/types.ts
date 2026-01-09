// Core game types

export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  position: Vector2;
  velocity: Vector2;
  radius: number;
  active: boolean;
}

export interface Player extends Entity {
  charge: number;
  maxCharge: number;
  chargeSpeed: number;
  isCharging: boolean;
  phaseActive: boolean;
  phaseTimer: number;
  phaseDuration: number;
  hp: number;
  maxHp: number;
  multiplier: number;
  heat: number;
  dashPower: number;
  magnetRange: number;
  invincible: boolean;
  invincibleTimer: number;
  // Mastery tracking
  lowHpTime: number; // Time spent at 1 HP
  lastPulseTime: number; // For rhythm tracking
}

export interface Pickup extends Entity {
  type: 'shard' | 'cell' | 'spark';
  value: number;
  magnetized: boolean;
}

export interface Hazard extends Entity {
  type: 'wall' | 'drone' | 'laser';
  phaseable: boolean;
  damage: number;
  // For walls
  width?: number;
  height?: number;
  // For lasers
  angle?: number;
  length?: number;
  telegraphed?: boolean;
  telegraphTimer?: number;
  // For drones
  speed?: number;
  // Near-miss tracking
  nearMissChecked?: boolean;
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  category: 'pulse' | 'movement' | 'defense' | 'economy' | 'synergy';
  effects: UpgradeEffect[];
  requiresMastery?: MasteryRequirement;
}

export interface UpgradeEffect {
  stat: string;
  modifier: 'add' | 'multiply';
  value: number;
}

export interface MasteryRequirement {
  track: 'timing' | 'risk' | 'build';
  level: number;
}

export interface MasteryProgress {
  timing: number;  // 0-100
  risk: number;    // 0-100
  build: number;   // 0-100
}

export interface MasteryStats {
  // Timing Mastery
  perfectPulses: number;
  rhythmStreak: number;      // Consecutive pulses with good timing
  maxRhythmStreak: number;
  
  // Risk Mastery
  nearMisses: number;        // Passed close to hazards without hitting
  lowHpSurvivalTime: number; // Seconds survived at 1 HP
  phaseThroughs: number;     // Times phased through phaseable hazards
  
  // Build Mastery
  categoriesUsed: Set<string>; // Unique upgrade categories used
  upgradesSynergized: number;  // Upgrades that combo with others
}

export interface RunMasteryData {
  stats: MasteryStats;
  xpGained: {
    timing: number;
    risk: number;
    build: number;
  };
}

export interface GameState {
  phase: 'menu' | 'countdown' | 'playing' | 'upgrade' | 'paused' | 'ended';
  timer: number;
  maxTime: number;
  score: number;
  shards: number;
  perfectPulses: number;
  distance: number;
  difficulty: number;
  upgradeChoices: Upgrade[];
  selectedUpgrades: Upgrade[];
  lastUpgradeTime: number;
  upgradeInterval: number;
  
  // Mastery tracking for current run
  masteryStats: MasteryStats;
  recentEvents: MasteryEvent[]; // For UI feedback
}

export interface MasteryEvent {
  id: string;
  type: 'perfect_pulse' | 'near_miss' | 'rhythm_streak' | 'phase_through' | 'low_hp_bonus' | 'category_bonus';
  timestamp: number;
  value?: number;
}

export interface GameConfig {
  screenWidth: number;
  screenHeight: number;
  worldWidth: number;
  worldHeight: number;
  targetFPS: number;
  fixedDeltaTime: number;
}

// Persistent mastery data
export interface PersistentMastery {
  progress: MasteryProgress;
  totalRuns: number;
  highScore: number;
  unlockedUpgrades: string[];
  unlockedCosmetics: string[];
}
