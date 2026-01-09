// Upgrade definitions with 12 NEW upgrades for meta-progression
// 
// BALANCE NOTES:
// ==============
// - Common upgrades: 15-30% improvement, always useful
// - Rare upgrades: 30-50% improvement or new mechanics
// - Legendary/Relic: Build-defining, skill-dependent
// 
// NEW UPGRADES (12 total):
// - 5 Common (2 Timing, 2 Risk, 1 Synergy)
// - 5 Rare (2 Timing, 2 Risk, 1 Synergy)
// - 2 Legendary/Relic (Synergy combos)

import { Upgrade } from '../types';

// ============================================
// BASE UPGRADES (Always Available)
// ============================================
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

// ============================================
// MASTERY-UNLOCKED UPGRADES (22 total)
// ============================================
export const MASTERY_UPGRADES: Upgrade[] = [
  // ============================================
  // TIMING MASTERY UPGRADES (6 total: 3 common, 2 rare, 1 from original)
  // ============================================
  
  // Common - Rewards perfect timing
  {
    id: 'tempo_surge',
    name: 'Tempo Surge',
    description: 'Perfect pulse grants +50% move speed for 2s',
    rarity: 'common',
    category: 'movement',
    effects: [{ stat: 'tempoSurge', modifier: 'add', value: 1 }],
    requiresMastery: { track: 'timing', level: 2 },
    blueprintCost: 50,
  },
  {
    id: 'pulse_memory',
    name: 'Pulse Memory',
    description: 'Perfect pulses reduce charge time by 10%',
    rarity: 'common',
    category: 'pulse',
    effects: [{ stat: 'pulseMemory', modifier: 'add', value: 0.1 }],
    requiresMastery: { track: 'timing', level: 3 },
    blueprintCost: 50,
  },
  
  // Rare - Streak rewards
  {
    id: 'perfect_flow',
    name: 'Perfect Flow',
    description: 'Each perfect pulse extends phase by 0.2s',
    rarity: 'rare',
    category: 'pulse',
    effects: [{ stat: 'perfectPhaseBonus', modifier: 'add', value: 0.2 }],
    requiresMastery: { track: 'timing', level: 4 },
    blueprintCost: 150,
  },
  {
    id: 'streak_shield',
    name: 'Streak Shield',
    description: 'Rhythm streak x5+ grants damage immunity',
    rarity: 'rare',
    category: 'defense',
    effects: [{ stat: 'streakShield', modifier: 'add', value: 1 }],
    requiresMastery: { track: 'timing', level: 5 },
    blueprintCost: 150,
  },
  {
    id: 'rhythm_master',
    name: 'Rhythm Master',
    description: 'Rhythm streak x3+ doubles score gain',
    rarity: 'rare',
    category: 'synergy',
    effects: [{ stat: 'rhythmScoreBonus', modifier: 'add', value: 2 }],
    requiresMastery: { track: 'timing', level: 6 },
    blueprintCost: 150,
  },
  
  // ============================================
  // RISK MASTERY UPGRADES (6 total: 3 common, 3 rare)
  // ============================================
  
  // Common - Near-miss rewards
  {
    id: 'close_call',
    name: 'Close Call',
    description: 'Near-misses grant 0.3s shield',
    rarity: 'common',
    category: 'defense',
    effects: [{ stat: 'nearMissShield', modifier: 'add', value: 0.3 }],
    requiresMastery: { track: 'risk', level: 2 },
    blueprintCost: 50,
  },
  {
    id: 'adrenaline_rush',
    name: 'Adrenaline Rush',
    description: 'Near-misses boost charge speed +20%',
    rarity: 'common',
    category: 'pulse',
    effects: [{ stat: 'adrenalineRush', modifier: 'add', value: 0.2 }],
    requiresMastery: { track: 'risk', level: 3 },
    blueprintCost: 50,
  },
  
  // Rare - Low HP rewards
  {
    id: 'danger_zone',
    name: 'Danger Zone',
    description: 'Near-misses boost next pulse +30%',
    rarity: 'rare',
    category: 'movement',
    effects: [{ stat: 'nearMissPulseBoost', modifier: 'add', value: 0.3 }],
    requiresMastery: { track: 'risk', level: 4 },
    blueprintCost: 150,
  },
  {
    id: 'last_stand',
    name: 'Last Stand',
    description: 'At 1 HP: +50% damage to hazards you phase',
    rarity: 'rare',
    category: 'defense',
    effects: [{ stat: 'lastStand', modifier: 'add', value: 0.5 }],
    requiresMastery: { track: 'risk', level: 5 },
    blueprintCost: 150,
  },
  {
    id: 'death_defier',
    name: 'Death Defier',
    description: 'At 1 HP: +100% score, heal on near-miss',
    rarity: 'rare',
    category: 'defense',
    effects: [{ stat: 'deathDefierBonus', modifier: 'add', value: 1 }],
    requiresMastery: { track: 'risk', level: 6 },
    blueprintCost: 150,
  },
  
  // ============================================
  // BUILD MASTERY UPGRADES (4 total: 2 common, 2 rare)
  // ============================================
  
  {
    id: 'versatile',
    name: 'Versatile',
    description: '+5% all stats per unique category',
    rarity: 'common',
    category: 'synergy',
    effects: [{ stat: 'versatileBonus', modifier: 'add', value: 0.05 }],
    requiresMastery: { track: 'build', level: 2 },
    blueprintCost: 50,
  },
  {
    id: 'synergy_core',
    name: 'Synergy Core',
    description: 'Upgrade effects +20% with 4+ categories',
    rarity: 'rare',
    category: 'synergy',
    effects: [{ stat: 'synergyCoreBonus', modifier: 'add', value: 0.2 }],
    requiresMastery: { track: 'build', level: 4 },
    blueprintCost: 150,
  },
  
  // ============================================
  // LEGENDARY RELICS (2 total - Synergy combos)
  // ============================================
  
  {
    id: 'pulse_virtuoso',
    name: 'Pulse Virtuoso',
    description: 'Perfect + near-miss = explosion wave',
    rarity: 'legendary',
    category: 'synergy',
    effects: [{ stat: 'virtuosoExplosion', modifier: 'add', value: 1 }],
    requiresMastery: { track: 'timing', level: 4 },
    blueprintCost: 400,
  },
  {
    id: 'forge_master',
    name: 'Forge Master',
    description: 'All mastery bonuses doubled this run',
    rarity: 'legendary',
    category: 'synergy',
    effects: [{ stat: 'forgeMasterBonus', modifier: 'multiply', value: 2 }],
    requiresMastery: { track: 'build', level: 6 },
    blueprintCost: 400,
  },
];

// ============================================
// BLUEPRINT-PURCHASABLE UPGRADES (New 12)
// These can be bought with blueprints even without mastery level
// ============================================
export const BLUEPRINT_UPGRADES: Upgrade[] = [
  // === TIMING REWARDS (4) ===
  {
    id: 'timing_echo',
    name: 'Timing Echo',
    description: 'Perfect pulses create afterimage that deals damage',
    rarity: 'common',
    category: 'pulse',
    effects: [{ stat: 'timingEcho', modifier: 'add', value: 1 }],
    blueprintCost: 75,
  },
  {
    id: 'metronome',
    name: 'Metronome',
    description: 'Consecutive perfect pulses increase dash +15% each',
    rarity: 'rare',
    category: 'movement',
    effects: [{ stat: 'metronome', modifier: 'add', value: 0.15 }],
    blueprintCost: 200,
  },
  {
    id: 'rhythm_heal',
    name: 'Rhythm Heal',
    description: 'Rhythm streak x10 restores 1 HP',
    rarity: 'rare',
    category: 'defense',
    effects: [{ stat: 'rhythmHeal', modifier: 'add', value: 1 }],
    blueprintCost: 200,
  },
  {
    id: 'perfect_magnet',
    name: 'Perfect Magnet',
    description: 'Perfect pulses pull ALL pickups to you',
    rarity: 'common',
    category: 'economy',
    effects: [{ stat: 'perfectMagnet', modifier: 'add', value: 1 }],
    blueprintCost: 75,
  },
  
  // === RISK REWARDS (4) ===
  {
    id: 'graze_bonus',
    name: 'Graze Bonus',
    description: 'Near-misses grant +5 score each',
    rarity: 'common',
    category: 'economy',
    effects: [{ stat: 'grazeBonus', modifier: 'add', value: 5 }],
    blueprintCost: 75,
  },
  {
    id: 'danger_magnet',
    name: 'Danger Magnet',
    description: 'Near-misses magnetize nearby shards',
    rarity: 'common',
    category: 'economy',
    effects: [{ stat: 'dangerMagnet', modifier: 'add', value: 1 }],
    blueprintCost: 75,
  },
  {
    id: 'risky_business',
    name: 'Risky Business',
    description: 'At 2 HP or less: +50% shard value',
    rarity: 'rare',
    category: 'economy',
    effects: [{ stat: 'riskyBusiness', modifier: 'add', value: 0.5 }],
    blueprintCost: 200,
  },
  {
    id: 'phoenix_pulse',
    name: 'Phoenix Pulse',
    description: 'Taking damage at 1 HP grants mega-pulse instead',
    rarity: 'rare',
    category: 'defense',
    effects: [{ stat: 'phoenixPulse', modifier: 'add', value: 1 }],
    blueprintCost: 200,
  },
  
  // === SYNERGY COMBOS (4) ===
  {
    id: 'chain_reaction',
    name: 'Chain Reaction',
    description: 'Phase-throughs trigger mini-pulses',
    rarity: 'rare',
    category: 'synergy',
    effects: [{ stat: 'chainReaction', modifier: 'add', value: 1 }],
    blueprintCost: 200,
  },
  {
    id: 'risk_reward',
    name: 'Risk & Reward',
    description: 'Each near-miss increases next perfect pulse bonus',
    rarity: 'rare',
    category: 'synergy',
    effects: [{ stat: 'riskReward', modifier: 'add', value: 1 }],
    blueprintCost: 200,
  },
  {
    id: 'omega_pulse',
    name: 'Omega Pulse',
    description: 'Every 10th pulse is massive (3x radius, 2x damage)',
    rarity: 'legendary',
    category: 'synergy',
    effects: [{ stat: 'omegaPulse', modifier: 'add', value: 1 }],
    blueprintCost: 500,
  },
  {
    id: 'time_dilation',
    name: 'Time Dilation',
    description: 'Perfect pulse slows time by 30% for 1s',
    rarity: 'legendary',
    category: 'synergy',
    effects: [{ stat: 'timeDilation', modifier: 'add', value: 1 }],
    blueprintCost: 500,
  },
];

// Combined list
export const ALL_UPGRADES = [...BASE_UPGRADES, ...MASTERY_UPGRADES, ...BLUEPRINT_UPGRADES];

// Get available upgrades based on unlocks
export function getAvailableUpgrades(unlockedIds: string[]): Upgrade[] {
  return ALL_UPGRADES.filter(upgrade => {
    // Base upgrades always available
    if (!upgrade.requiresMastery && !upgrade.blueprintCost) return true;
    // Check if unlocked
    return unlockedIds.includes(upgrade.id);
  });
}

// Get all unlockable upgrades (for shop)
export function getUnlockableUpgrades(): Upgrade[] {
  return [...MASTERY_UPGRADES, ...BLUEPRINT_UPGRADES];
}

// Legacy export
export const UPGRADES = BASE_UPGRADES;
