// Hazard system with Drones, Lasers, and Deterministic Difficulty
// 
// HAZARD TUNING PARAMETERS:
// ========================
// 
// WALLS:
//   - Width: 60-160px (random)
//   - Height: 20px
//   - Phaseable chance: 50%
//   - Spawn rate: Increases with difficulty
//
// DRONES:
//   - Radius: 18px
//   - Base speed: 60px/s (increases with difficulty)
//   - Max speed: 120px/s
//   - Acceleration telegraph: 0.3s glow before speeding up
//   - Phaseable chance: 40% (some drones are solid)
//   - Telegraph duration: 0.8s warning before activation
//
// LASERS:
//   - Telegraph duration: 0.5s (500ms warning line)
//   - Active duration: 0.4s (400ms damage beam)
//   - Width: Full screen (horizontal or diagonal)
//   - Safe zones: Always leave gap for dodging
//   - Phaseable: Always (can phase through if timed right)
//
// DIFFICULTY CURVE (per 15s segment):
//   Segment 1 (0-15s):   Walls only, sparse
//   Segment 2 (15-30s):  Walls + first drones
//   Segment 3 (30-45s):  Walls + drones + first lasers
//   Segment 4 (45-60s):  All hazards, moderate density
//   Segment 5 (60-75s):  All hazards, high density
//   Segment 6 (75-90s):  All hazards, intense + faster drones

import { Hazard, Player, GameConfig } from '../types';
import { damagePlayer } from './player';

let hazardIdCounter = 0;
let lastWallSpawnY = 0;
let lastDroneSpawnTime = 0;
let lastLaserSpawnTime = 0;

// Near-miss threshold (pixels from edge)
const NEAR_MISS_THRESHOLD = 25;

// ============================================
// DIFFICULTY SEGMENT CONFIGURATION
// ============================================
interface DifficultySegment {
  wallSpawnRate: number;      // Base spawn interval in Y distance
  wallDensity: number;        // 0-1, chance to spawn
  droneEnabled: boolean;
  droneSpawnInterval: number; // Seconds between drone spawns
  droneSpeed: number;         // Pixels per second
  laserEnabled: boolean;
  laserSpawnInterval: number; // Seconds between laser spawns
}

const DIFFICULTY_SEGMENTS: DifficultySegment[] = [
  // Segment 1: 0-15s - Easy introduction
  {
    wallSpawnRate: 250,
    wallDensity: 0.4,
    droneEnabled: false,
    droneSpawnInterval: 999,
    droneSpeed: 0,
    laserEnabled: false,
    laserSpawnInterval: 999,
  },
  // Segment 2: 15-30s - Introduce drones
  {
    wallSpawnRate: 220,
    wallDensity: 0.5,
    droneEnabled: true,
    droneSpawnInterval: 8,
    droneSpeed: 60,
    laserEnabled: false,
    laserSpawnInterval: 999,
  },
  // Segment 3: 30-45s - Introduce lasers
  {
    wallSpawnRate: 200,
    wallDensity: 0.55,
    droneEnabled: true,
    droneSpawnInterval: 6,
    droneSpeed: 70,
    laserEnabled: true,
    laserSpawnInterval: 10,
  },
  // Segment 4: 45-60s - All hazards moderate
  {
    wallSpawnRate: 180,
    wallDensity: 0.6,
    droneEnabled: true,
    droneSpawnInterval: 5,
    droneSpeed: 80,
    laserEnabled: true,
    laserSpawnInterval: 7,
  },
  // Segment 5: 60-75s - High density
  {
    wallSpawnRate: 160,
    wallDensity: 0.65,
    droneEnabled: true,
    droneSpawnInterval: 4,
    droneSpeed: 90,
    laserEnabled: true,
    laserSpawnInterval: 5,
  },
  // Segment 6: 75-90s - Intense finale
  {
    wallSpawnRate: 140,
    wallDensity: 0.7,
    droneEnabled: true,
    droneSpawnInterval: 3,
    droneSpeed: 110,
    laserEnabled: true,
    laserSpawnInterval: 4,
  },
];

function getCurrentSegment(elapsedTime: number): DifficultySegment {
  const segmentIndex = Math.min(
    Math.floor(elapsedTime / 15),
    DIFFICULTY_SEGMENTS.length - 1
  );
  return DIFFICULTY_SEGMENTS[segmentIndex];
}

// ============================================
// SPAWNING FUNCTIONS
// ============================================

export function spawnHazards(
  playerY: number, 
  config: GameConfig, 
  difficulty: number,
  elapsedTime: number
): Hazard[] {
  const hazards: Hazard[] = [];
  const segment = getCurrentSegment(elapsedTime);
  const spawnDistance = playerY + config.screenHeight + 100;
  
  // === WALLS ===
  if (spawnDistance - lastWallSpawnY > segment.wallSpawnRate) {
    lastWallSpawnY = spawnDistance;
    
    if (Math.random() < segment.wallDensity) {
      const isPhaseable = Math.random() < 0.5;
      const wallWidth = 60 + Math.random() * 100;
      
      hazards.push({
        id: `wall_${++hazardIdCounter}`,
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
  
  // === DRONES ===
  if (segment.droneEnabled && elapsedTime - lastDroneSpawnTime > segment.droneSpawnInterval) {
    lastDroneSpawnTime = elapsedTime;
    
    const isPhaseable = Math.random() < 0.4;
    // Spawn from sides of screen
    const spawnFromLeft = Math.random() < 0.5;
    
    hazards.push({
      id: `drone_${++hazardIdCounter}`,
      position: {
        x: spawnFromLeft ? -30 : config.screenWidth + 30,
        y: playerY + Math.random() * config.screenHeight * 0.5,
      },
      velocity: { x: 0, y: 0 },
      radius: 18,
      active: true,
      type: 'drone',
      phaseable: isPhaseable,
      damage: 1,
      speed: segment.droneSpeed,
      // Drone-specific: telegraph state
      telegraphed: true,
      telegraphTimer: 0.8, // 0.8s warning before chase starts
      nearMissChecked: false,
    });
  }
  
  // === LASERS ===
  if (segment.laserEnabled && elapsedTime - lastLaserSpawnTime > segment.laserSpawnInterval) {
    lastLaserSpawnTime = elapsedTime;
    
    // Determine laser type: horizontal or diagonal
    const isHorizontal = Math.random() < 0.7;
    const laserY = playerY + config.screenHeight * 0.4 + Math.random() * config.screenHeight * 0.3;
    
    // Create safe gap (never block entire screen)
    const gapSize = 80 + Math.random() * 40; // 80-120px gap
    const gapPosition = 50 + Math.random() * (config.screenWidth - gapSize - 100);
    
    if (isHorizontal) {
      // Two laser segments with gap
      hazards.push({
        id: `laser_${++hazardIdCounter}`,
        position: { x: 0, y: laserY },
        velocity: { x: 0, y: 0 },
        radius: 0,
        active: true,
        type: 'laser',
        phaseable: true, // Lasers can always be phased
        damage: 1,
        width: gapPosition,
        height: 12,
        angle: 0,
        length: gapPosition,
        telegraphed: true,
        telegraphTimer: 0.5, // 500ms telegraph
        nearMissChecked: false,
      });
      
      hazards.push({
        id: `laser_${++hazardIdCounter}`,
        position: { x: gapPosition + gapSize, y: laserY },
        velocity: { x: 0, y: 0 },
        radius: 0,
        active: true,
        type: 'laser',
        phaseable: true,
        damage: 1,
        width: config.screenWidth - gapPosition - gapSize,
        height: 12,
        angle: 0,
        length: config.screenWidth - gapPosition - gapSize,
        telegraphed: true,
        telegraphTimer: 0.5,
        nearMissChecked: false,
      });
    }
  }
  
  return hazards;
}

// ============================================
// UPDATE FUNCTIONS
// ============================================

export function updateHazards(hazards: Hazard[], player: Player, dt: number) {
  hazards.forEach((hazard) => {
    if (!hazard.active) return;
    
    switch (hazard.type) {
      case 'drone':
        // Update telegraph timer
        if (hazard.telegraphed && hazard.telegraphTimer !== undefined && hazard.telegraphTimer > 0) {
          hazard.telegraphTimer -= dt;
        } else {
          hazard.telegraphed = false;
          // Chase player with smooth acceleration
          if (hazard.speed) {
            const dx = player.position.x - hazard.position.x;
            const dy = player.position.y - hazard.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
              // Smooth acceleration toward player
              const targetVelX = (dx / dist) * hazard.speed;
              const targetVelY = (dy / dist) * hazard.speed;
              hazard.velocity.x += (targetVelX - hazard.velocity.x) * 0.05;
              hazard.velocity.y += (targetVelY - hazard.velocity.y) * 0.05;
            }
          }
        }
        break;
        
      case 'laser':
        // Update telegraph timer
        if (hazard.telegraphTimer !== undefined && hazard.telegraphTimer > 0) {
          hazard.telegraphTimer -= dt;
          if (hazard.telegraphTimer <= 0) {
            hazard.telegraphed = false;
            // Start active timer (reuse telegraphTimer for active duration)
            hazard.telegraphTimer = -0.4; // Negative = active phase, -0.4 to 0
          }
        } else if (hazard.telegraphTimer !== undefined && hazard.telegraphTimer < 0) {
          hazard.telegraphTimer += dt;
          if (hazard.telegraphTimer >= 0) {
            // Laser finished, deactivate
            hazard.active = false;
          }
        }
        break;
    }
    
    hazard.position.x += hazard.velocity.x * dt;
    hazard.position.y += hazard.velocity.y * dt;
  });
}

// ============================================
// COLLISION DETECTION
// ============================================

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
    
    let distance = Infinity;
    let collision = false;
    
    switch (hazard.type) {
      case 'wall':
        if (hazard.width && hazard.height) {
          const closestX = Math.max(hazard.position.x, Math.min(player.position.x, hazard.position.x + hazard.width));
          const closestY = Math.max(hazard.position.y, Math.min(player.position.y, hazard.position.y + hazard.height));
          
          const dx = player.position.x - closestX;
          const dy = player.position.y - closestY;
          distance = Math.sqrt(dx * dx + dy * dy);
          
          collision = distance < player.radius;
          
          // Near-miss detection
          if (!hazard.nearMissChecked && !collision && distance < player.radius + NEAR_MISS_THRESHOLD) {
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
        // Only check collision if drone is actively chasing (not telegraphing)
        if (!hazard.telegraphed) {
          const dx = hazard.position.x - player.position.x;
          const dy = hazard.position.y - player.position.y;
          distance = Math.sqrt(dx * dx + dy * dy);
          collision = distance < player.radius + hazard.radius;
          
          // Near-miss for drones
          if (!collision && distance < player.radius + hazard.radius + NEAR_MISS_THRESHOLD) {
            if (!hazard.nearMissChecked) {
              hazard.nearMissChecked = true;
              if (!wasPhased) {
                nearMisses++;
              }
            }
          }
          
          // Phase through drone
          if (wasPhased && collision && !hazard.nearMissChecked) {
            hazard.nearMissChecked = true;
            phaseThroughs++;
            collision = false; // Cancel collision due to phase
          }
        }
        break;
        
      case 'laser':
        // Only check collision when laser is active (telegraphTimer < 0)
        if (hazard.telegraphTimer !== undefined && hazard.telegraphTimer < 0 && hazard.width && hazard.height) {
          // Check if player overlaps with laser beam
          const laserLeft = hazard.position.x;
          const laserRight = hazard.position.x + hazard.width;
          const laserTop = hazard.position.y - hazard.height / 2;
          const laserBottom = hazard.position.y + hazard.height / 2;
          
          const playerLeft = player.position.x - player.radius;
          const playerRight = player.position.x + player.radius;
          const playerTop = player.position.y - player.radius;
          const playerBottom = player.position.y + player.radius;
          
          // AABB collision
          collision = playerRight > laserLeft && 
                     playerLeft < laserRight && 
                     playerBottom > laserTop && 
                     playerTop < laserBottom;
          
          // Phase through laser
          if (wasPhased && collision && !hazard.nearMissChecked) {
            hazard.nearMissChecked = true;
            phaseThroughs++;
            collision = false;
          }
          
          // Near-miss for laser (passed close without getting hit)
          if (!collision && !hazard.nearMissChecked) {
            const horizontalDist = Math.min(
              Math.abs(playerRight - laserLeft),
              Math.abs(playerLeft - laserRight)
            );
            const verticalDist = Math.min(
              Math.abs(playerBottom - laserTop),
              Math.abs(playerTop - laserBottom)
            );
            
            if (horizontalDist < NEAR_MISS_THRESHOLD || verticalDist < NEAR_MISS_THRESHOLD) {
              // Check if laser has finished
              if (hazard.telegraphTimer !== undefined && hazard.telegraphTimer > -0.1) {
                hazard.nearMissChecked = true;
                nearMisses++;
              }
            }
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

// ============================================
// RESET
// ============================================

export function resetHazardSpawner() {
  lastWallSpawnY = 0;
  lastDroneSpawnTime = 0;
  lastLaserSpawnTime = 0;
  hazardIdCounter = 0;
}
