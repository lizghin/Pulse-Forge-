// Upgrade definitions with mastery-based unlocks
// TUNING NOTES:
// - Common upgrades: Small, reliable buffs (15-30% improvement)
// - Rare upgrades: Significant buffs or new mechanics (30-50% improvement)
// - Legendary/Relic: Build-defining, require skill to maximize
// - Perfect timing rewards: Scale with player skill, not just stats
// - Near-miss rewards: High risk/reward for advanced players

import { Upgrade } from '../types';

// Base upgrades (always available)
export const BASE_UPGRADES: Upgrade[] = [
  // === PULSE MODS ===
  {
    id: 'wider_burst',
    name: 'Wider Burst',
    description: 'Pulse radius +30%',
    rarity: 'common',
    category: 'pulse',
    effects: [{ stat: 'pulseRadius', modifier: 'multiply', value: 1.3 }],
  },
  {
    id: 'longer_phase',
    name: 'Extended Phase',
    description: 'Phase duration +0.3s',
    rarity: 'common',
    category: 'pulse',
    effects: [{ stat: 'phaseDuration', modifier: 'add', value: 0.3 }],
  },
  {
    id: 'quick_charge',
    name: 'Quick Charge',
    description: 'Charge speed +25%',
    rarity: 'uncommon',
    category: 'pulse',
    effects: [{ stat: 'chargeSpeed', modifier: 'multiply', value: 1.25 }],
  },
  
  // === MOVEMENT ===
  {
    id: 'power_dash',
    name: 'Power Dash',
    description: 'Dash power +20%',
    rarity: 'common',
    category: 'movement',
    effects: [{ stat: 'dashPower', modifier: 'multiply', value: 1.2 }],
  },
  {
    id: 'steady_charge',
    name: 'Steady Charge',
    description: 'Less slowdown while charging',
    rarity: 'uncommon',
    category: 'movement',
    effects: [{ stat: 'chargeSlowdown', modifier: 'multiply', value: 0.7 }],
  },
  
  // === DEFENSE ===
  {
    id: 'extra_heart',
    name: 'Extra Heart',
    description: '+1 Max HP',
    rarity: 'rare',
    category: 'defense',
    effects: [{ stat: 'maxHp', modifier: 'add', value: 1 }],
  },
  {
    id: 'longer_invincibility',
    name: 'Iron Skin',
    description: 'Invincibility time +0.5s',
    rarity: 'uncommon',
    category: 'defense',
    effects: [{ stat: 'invincibilityDuration', modifier: 'add', value: 0.5 }],
  },
  
  // === ECONOMY ===
  {
    id: 'magnet_plus',
    name: 'Magnet+',
    description: 'Pickup magnet range +40%',
    rarity: 'common',
    category: 'economy',
    effects: [{ stat: 'magnetRange', modifier: 'multiply', value: 1.4 }],
  },
  {
    id: 'shard_value',
    name: 'Shard Value',
    description: 'Shards worth +25%',
    rarity: 'uncommon',
    category: 'economy',
    effects: [{ stat: 'shardMultiplier', modifier: 'multiply', value: 1.25 }],
  },
  
  // === SYNERGY (Base) ===
  {
    id: 'echo_coil',
    name: 'Echo Coil',
    description: 'Perfect pulse emits mini-burst',
    rarity: 'legendary',
    category: 'synergy',
    effects: [{ stat: 'echoPulse', modifier: 'add', value: 1 }],
  },
  {
    id: 'phase_lattice',
    name: 'Phase Lattice',
    description: 'Phasing through hazard refunds charge',
    rarity: 'rare',
    category: 'synergy',
    effects: [{ stat: 'phaseRefund', modifier: 'add', value: 0.3 }],
  },
  {
    id: 'heat_sync',
    name: 'Heat Sync',
    description: 'High heat increases score multiplier',
    rarity: 'rare',
    category: 'synergy',
    effects: [{ stat: 'heatBonus', modifier: 'add', value: 1 }],
  },
];

// NEW: Mastery-unlocked upgrades (10 new upgrades)
export const MASTERY_UPGRADES: Upgrade[] = [
  // === TIMING MASTERY REWARDS ===
  // Rewards perfect pulse timing
  {
    id: 'tempo_surge',
    name: 'Tempo Surge',
    description: 'Perfect pulse grants +50% move speed for 2s',
    rarity: 'common',
    category: 'pulse',
    effects: [{ stat: 'tempoSurge', modifier: 'add', value: 1 }],
    requiresMastery: { track: 'timing', level: 2 },
  },
  {
    id: 'perfect_flow',
    name: 'Perfect Flow',
    description: 'Each perfect pulse extends phase by 0.2s',
    rarity: 'rare',
    category: 'pulse',
    effects: [{ stat: 'perfectPhaseBonus', modifier: 'add', value: 0.2 }],
    requiresMastery: { track: 'timing', level: 4 },
  },
  {
    id: 'rhythm_master',
    name: 'Rhythm Master',
    description: 'Rhythm streak x3+ doubles score gain',
    rarity: 'rare',
    category: 'synergy',
    effects: [{ stat: 'rhythmScoreBonus', modifier: 'add', value: 2 }],
    requiresMastery: { track: 'timing', level: 6 },
  },
  
  // === RISK MASTERY REWARDS ===
  // Rewards near-miss play
  {
    id: 'close_call',
    name: 'Close Call',
    description: 'Near-misses grant brief shield',
    rarity: 'common',
    category: 'defense',
    effects: [{ stat: 'nearMissShield', modifier: 'add', value: 0.5 }],
    requiresMastery: { track: 'risk', level: 2 },
  },
  {
    id: 'danger_zone',
    name: 'Danger Zone',
    description: 'Near-misses boost next pulse +30%',
    rarity: 'rare',
    category: 'movement',
    effects: [{ stat: 'nearMissPulseBoost', modifier: 'add', value: 0.3 }],
    requiresMastery: { track: 'risk', level: 4 },
  },
  {
    id: 'death_defier',
    name: 'Death Defier',
    description: 'At 1 HP: +100% score, attacks heal on dodge',
    rarity: 'rare',
    category: 'defense',
    effects: [{ stat: 'deathDefierBonus', modifier: 'add', value: 1 }],
    requiresMastery: { track: 'risk', level: 6 },
  },
  
  // === BUILD MASTERY REWARDS ===
  // Rewards diverse builds
  {
    id: 'versatile',
    name: 'Versatile',
    description: '+5% all stats per unique category owned',
    rarity: 'common',
    category: 'synergy',
    effects: [{ stat: 'versatileBonus', modifier: 'add', value: 0.05 }],
    requiresMastery: { track: 'build', level: 2 },
  },
  {
    id: 'synergy_core',
    name: 'Synergy Core',
    description: 'Upgrade effects +20% when you have 4+ categories',
    rarity: 'rare',
    category: 'synergy',
    effects: [{ stat: 'synergyCoreBonus', modifier: 'add', value: 0.2 }],
    requiresMastery: { track: 'build', level: 4 },
  },
  
  // === COMBINED MASTERY REWARDS (Relics) ===
  {
    id: 'pulse_virtuoso',
    name: 'Pulse Virtuoso',
    description: 'Perfect timing + near-miss = explosion wave',
    rarity: 'legendary',
    category: 'synergy',
    effects: [{ stat: 'virtuosoExplosion', modifier: 'add', value: 1 }],
    requiresMastery: { track: 'timing', level: 4 }, // Also needs risk 4
  },
  {
    id: 'forge_master',
    name: 'Forge Master',
    description: 'All mastery bonuses doubled this run',
    rarity: 'legendary',
    category: 'synergy',
    effects: [{ stat: 'forgeMasterBonus', modifier: 'multiply', value: 2 }],
    requiresMastery: { track: 'build', level: 6 },
  },
];

// Combined list - filter based on unlocks in store
export const ALL_UPGRADES = [...BASE_UPGRADES, ...MASTERY_UPGRADES];

// Get available upgrades based on mastery unlocks
export function getAvailableUpgrades(unlockedIds: string[]): Upgrade[] {
  return ALL_UPGRADES.filter(upgrade => {
    // Base upgrades always available
    if (!upgrade.requiresMastery) return true;
    // Mastery upgrades need to be unlocked
    return unlockedIds.includes(upgrade.id);
  });
}

// Legacy export for compatibility
export const UPGRADES = BASE_UPGRADES;
