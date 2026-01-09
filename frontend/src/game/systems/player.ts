// Player system

import { Player, GameConfig, Vector2 } from '../types';

let playerIdCounter = 0;

export function createPlayer(config: GameConfig): Player {
  return {
    id: `player_${++playerIdCounter}`,
    position: { x: config.screenWidth / 2, y: 100 },
    velocity: { x: 0, y: 0 },
    radius: 20,
    active: true,
    charge: 0,
    maxCharge: 1,
    chargeSpeed: 1.5,
    isCharging: false,
    phaseActive: false,
    phaseTimer: 0,
    phaseDuration: 0.8,
    hp: 3,
    maxHp: 3,
    multiplier: 1,
    heat: 0,
    dashPower: 400,
    magnetRange: 150,
    invincible: false,
    invincibleTimer: 0,
  };
}

export function updatePlayer(player: Player, dt: number, config: GameConfig) {
  // Auto-scroll upward
  const baseSpeed = 100;
  const chargeSlowdown = player.isCharging ? 0.6 : 1;
  player.velocity.y = baseSpeed * chargeSlowdown;
  
  // Apply velocity
  player.position.y += player.velocity.y * dt;
  
  // Horizontal movement friction
  player.velocity.x *= 0.95;
  player.position.x += player.velocity.x * dt;
  
  // Keep player in bounds horizontally
  player.position.x = Math.max(player.radius, Math.min(config.screenWidth - player.radius, player.position.x));
  
  // Update charge
  if (player.isCharging) {
    player.charge = Math.min(player.maxCharge, player.charge + player.chargeSpeed * dt);
  }
  
  // Update phase timer
  if (player.phaseActive) {
    player.phaseTimer -= dt;
    if (player.phaseTimer <= 0) {
      player.phaseActive = false;
    }
  }
  
  // Update invincibility
  if (player.invincible) {
    player.invincibleTimer -= dt;
    if (player.invincibleTimer <= 0) {
      player.invincible = false;
    }
  }
  
  // Reduce heat over time
  player.heat = Math.max(0, player.heat - 0.1 * dt);
}

export function damagePlayer(player: Player, damage: number, store: any) {
  if (player.invincible) return;
  
  player.hp -= damage;
  player.invincible = true;
  player.invincibleTimer = 1.5;
  
  if (player.hp <= 0) {
    store.setPhase('ended');
  }
}
