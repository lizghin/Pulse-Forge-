// Hazard system

import { Hazard, Player, GameConfig } from '../types';
import { damagePlayer } from './player';

let hazardIdCounter = 0;
let lastSpawnY = 0;

export function spawnHazards(playerY: number, config: GameConfig, difficulty: number): Hazard[] {
  const hazards: Hazard[] = [];
  const spawnDistance = playerY + config.screenHeight + 100;
  
  // Spawn walls at intervals
  if (spawnDistance - lastSpawnY > 200 / difficulty) {
    lastSpawnY = spawnDistance;
    
    // Random wall
    if (Math.random() < 0.4) {
      const isPhaseable = Math.random() < 0.5;
      const wallWidth = 60 + Math.random() * 100;
      
      hazards.push({
        id: `hazard_${++hazardIdCounter}`,
        position: {
          x: Math.random() * (config.screenWidth - wallWidth),
          y: spawnDistance,
        },
        velocity: { x: 0, y: 0 },
        radius: 0,
        active: true,
        type: 'wall',
        phaseable: isPhaseable,
        damage: 1,
        width: wallWidth,
        height: 20,
      });
    }
  }
  
  return hazards;
}

export function updateHazards(hazards: Hazard[], player: Player, dt: number) {
  hazards.forEach((hazard) => {
    if (!hazard.active) return;
    
    switch (hazard.type) {
      case 'drone':
        // Chase player
        if (hazard.speed) {
          const dx = player.position.x - hazard.position.x;
          const dy = player.position.y - hazard.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            hazard.velocity.x = (dx / dist) * hazard.speed;
            hazard.velocity.y = (dy / dist) * hazard.speed;
          }
        }
        break;
      case 'laser':
        if (hazard.telegraphed && hazard.telegraphTimer) {
          hazard.telegraphTimer -= dt;
        }
        break;
    }
    
    hazard.position.x += hazard.velocity.x * dt;
    hazard.position.y += hazard.velocity.y * dt;
  });
}

export function checkHazardCollisions(hazards: Hazard[], player: Player, store: any) {
  hazards.forEach((hazard) => {
    if (!hazard.active) return;
    
    // Skip phaseable hazards when player is phasing
    if (hazard.phaseable && player.phaseActive) return;
    
    let collision = false;
    
    switch (hazard.type) {
      case 'wall':
        // Rectangle collision
        if (hazard.width && hazard.height) {
          const closestX = Math.max(hazard.position.x, Math.min(player.position.x, hazard.position.x + hazard.width));
          const closestY = Math.max(hazard.position.y, Math.min(player.position.y, hazard.position.y + hazard.height));
          
          const dx = player.position.x - closestX;
          const dy = player.position.y - closestY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          collision = dist < player.radius;
        }
        break;
      case 'drone':
        const dx = hazard.position.x - player.position.x;
        const dy = hazard.position.y - player.position.y;
        collision = Math.sqrt(dx * dx + dy * dy) < player.radius + hazard.radius;
        break;
    }
    
    if (collision) {
      damagePlayer(player, hazard.damage, store);
    }
  });
}

export function resetHazardSpawner() {
  lastSpawnY = 0;
}
