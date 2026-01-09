// Upgrade definitions

import { Upgrade } from '../types';

export const UPGRADES: Upgrade[] = [
  // Pulse Mods
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
  
  // Movement
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
  
  // Defense
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
  
  // Economy
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
  
  // Synergy (Rare)
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
