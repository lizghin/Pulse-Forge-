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
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  category: 'pulse' | 'movement' | 'defense' | 'economy' | 'synergy';
  effects: UpgradeEffect[];
}

export interface UpgradeEffect {
  stat: string;
  modifier: 'add' | 'multiply';
  value: number;
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
}

export interface GameConfig {
  screenWidth: number;
  screenHeight: number;
  worldWidth: number;
  worldHeight: number;
  targetFPS: number;
  fixedDeltaTime: number;
}
