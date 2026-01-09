// Core game types with Blueprints meta-progression

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
  lowHpTime: number;
  lastPulseTime: number;
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
  width?: number;
  height?: number;
  angle?: number;
  length?: number;
  telegraphed?: boolean;
  telegraphTimer?: number;
  speed?: number;
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
  blueprintCost?: number; // Cost to unlock with blueprints
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
  timing: number;
  risk: number;
  build: number;
}

export interface MasteryStats {
  perfectPulses: number;
  rhythmStreak: number;
  maxRhythmStreak: number;
  nearMisses: number;
  lowHpSurvivalTime: number;
  phaseThroughs: number;
  categoriesUsed: Set<string>;
  upgradesSynergized: number;
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
  masteryStats: MasteryStats;
  recentEvents: MasteryEvent[];
}

export interface MasteryEvent {
  id: string;
  type: 'perfect_pulse' | 'near_miss' | 'rhythm_streak' | 'phase_through' | 'low_hp_bonus' | 'category_bonus' | 'blueprint_earned';
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

// Cosmetic skin definition
export interface CosmeticSkin {
  id: string;
  name: string;
  description: string;
  coreColor: string;
  glowColor: string;
  phaseColor: string;
  blueprintCost: number;
}

// Hazard theme definition
export interface HazardTheme {
  id: string;
  name: string;
  description: string;
  wallColor: string;
  droneColor: string;
  laserColor: string;
  blueprintCost: number;
}

// Persistent mastery data with Blueprints
export interface PersistentMastery {
  progress: MasteryProgress;
  totalRuns: number;
  highScore: number;
  blueprints: number; // Meta currency
  unlockedUpgrades: string[];
  unlockedCosmetics: string[];
  unlockedThemes: string[];
  selectedSkin: string;
  selectedTheme: string;
}

// Run rewards summary
export interface RunRewards {
  baseBlueprints: number;
  timingBonus: number;
  riskBonus: number;
  buildBonus: number;
  totalBlueprints: number;
}

// Forged Skin Recipe (re-exported from skinForge)
export interface SkinRecipe {
  id: string;
  prompt: string;
  seed: string;
  createdAt: number;
  
  // Visual properties
  baseShape: 'circle' | 'hexagon' | 'diamond' | 'star' | 'ring';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  auraType: 'glow' | 'rings' | 'pulse' | 'glitch' | 'flame' | 'electric';
  particleStyle: 'sparks' | 'dots' | 'stars' | 'none' | 'bubbles' | 'lightning';
  outlineStyle: 'solid' | 'dashed' | 'double' | 'none' | 'gradient';
  outlineColor: string;
  
  // Animation hints
  pulseSpeed: number;
  rotationSpeed: number;
  glowIntensity: number;
  
  // NFT metadata
  mintedOnChain?: boolean;
  tokenId?: string;
  transactionHash?: string;
}
