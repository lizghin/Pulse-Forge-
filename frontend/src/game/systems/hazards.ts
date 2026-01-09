// Hazard system with near-miss detection

import { Hazard, Player, GameConfig } from '../types';
import { damagePlayer } from './player';

let hazardIdCounter = 0;
let lastSpawnY = 0;

// Near-miss threshold (pixels from edge)
const NEAR_MISS_THRESHOLD = 25;

export function spawnHazards(playerY: number, config: GameConfig, difficulty: number): Hazard[] {
  const hazards: Hazard[] = [];
  const spawnDistance = playerY + config.screenHeight + 100;
  
  // Spawn walls at intervals
  if (spawnDistance - lastSpawnY > 200 / difficulty) {
    lastSpawnY = spawnDistance;
    
    // Random wall
    if (Math.random() < 0.5) {
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
        nearMissChecked: false,
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

export interface CollisionResult {
  collisions: boolean;
  nearMisses: number;
  phaseThroughs: number;
}

export function checkHazardCollisions(
  hazards: Hazard[], 
  player: Player, 
  store: any
): CollisionResult {
  let nearMisses = 0;
  let phaseThroughs = 0;
  
  hazards.forEach((hazard) => {
    if (!hazard.active) return;
    
    const wasPhased = hazard.phaseable && player.phaseActive;
    
    // Calculate distance for both collision and near-miss
    let distance = Infinity;
    let collision = false;
    
    switch (hazard.type) {
      case 'wall':
        // Rectangle collision with near-miss detection
        if (hazard.width && hazard.height) {
          const closestX = Math.max(hazard.position.x, Math.min(player.position.x, hazard.position.x + hazard.width));
          const closestY = Math.max(hazard.position.y, Math.min(player.position.y, hazard.position.y + hazard.height));
          
          const dx = player.position.x - closestX;
          const dy = player.position.y - closestY;
          distance = Math.sqrt(dx * dx + dy * dy);
          
          collision = distance < player.radius;
          
          // Near-miss check: player passed close but didn't collide
          if (!hazard.nearMissChecked && !collision && distance < player.radius + NEAR_MISS_THRESHOLD) {
            // Check if player has passed the hazard vertically
            const playerBottom = player.position.y - player.radius;
            const hazardTop = hazard.position.y + (hazard.height || 20);
            
            if (playerBottom > hazardTop) {
              hazard.nearMissChecked = true;
              if (!wasPhased) {
                nearMisses++;
              }
            }
          }
          
          // Phase through detection
          if (wasPhased && !hazard.nearMissChecked) {
            const playerCenter = player.position.y;
            const hazardCenter = hazard.position.y + (hazard.height || 20) / 2;
            
            // Check if player passed through
            if (Math.abs(playerCenter - hazardCenter) < player.radius + (hazard.height || 20) / 2 + 10) {
              const horizontalOverlap = player.position.x > hazard.position.x - player.radius && 
                                        player.position.x < hazard.position.x + (hazard.width || 60) + player.radius;
              if (horizontalOverlap) {
                hazard.nearMissChecked = true;
                phaseThroughs++;
              }
            }
          }
        }
        break;
      case 'drone':
        const dx = hazard.position.x - player.position.x;
        const dy = hazard.position.y - player.position.y;
        distance = Math.sqrt(dx * dx + dy * dy);
        collision = distance < player.radius + hazard.radius;
        
        // Near-miss for drones
        if (!collision && distance < player.radius + hazard.radius + NEAR_MISS_THRESHOLD) {
          if (!hazard.nearMissChecked) {
            hazard.nearMissChecked = true;
            nearMisses++;
          }
        }
        break;
    }
    
    // Skip collision damage for phaseable hazards when player is phasing
    if (wasPhased) return;
    
    if (collision) {
      damagePlayer(player, hazard.damage, store);
    }
  });
  
  return { collisions: false, nearMisses, phaseThroughs };
}

export function resetHazardSpawner() {
  lastSpawnY = 0;
  hazardIdCounter = 0;
}
