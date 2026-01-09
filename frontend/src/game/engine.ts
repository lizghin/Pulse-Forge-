// Game engine - fixed timestep loop with Mastery tracking

import { GameConfig, Player, Pickup, Hazard } from './types';
import { createPlayer, updatePlayer } from './systems/player';
import { updatePickups, spawnPickup, checkPickupCollisions } from './systems/pickups';
import { updateHazards, spawnHazards, checkHazardCollisions } from './systems/hazards';
import { useGameStore } from './store';

export const DEFAULT_CONFIG: GameConfig = {
  screenWidth: 390,
  screenHeight: 844,
  worldWidth: 390,
  worldHeight: 2000,
  targetFPS: 60,
  fixedDeltaTime: 1000 / 60,
};

// Rhythm timing window (seconds between pulses for streak)
const RHYTHM_WINDOW_MIN = 0.8;
const RHYTHM_WINDOW_MAX = 1.5;

export class GameEngine {
  private config: GameConfig;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private animationFrameId: number | null = null;
  private running: boolean = false;
  
  public player: Player;
  public pickups: Pickup[] = [];
  public hazards: Hazard[] = [];
  public cameraY: number = 0;
  
  // Mastery tracking
  private lastPulseTime: number = 0;
  
  constructor(config: Partial<GameConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.player = createPlayer(this.config);
  }
  
  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.player = createPlayer(this.config);
    this.pickups = [];
    this.hazards = [];
    this.cameraY = 0;
    this.lastPulseTime = 0;
    this.loop();
  }
  
  stop() {
    this.running = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  pause() {
    this.running = false;
  }
  
  resume() {
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }
  
  private loop = () => {
    if (!this.running) return;
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    this.accumulator += deltaTime;
    
    const store = useGameStore.getState();
    
    // Fixed timestep updates
    while (this.accumulator >= this.config.fixedDeltaTime) {
      if (store.phase === 'playing') {
        this.fixedUpdate(this.config.fixedDeltaTime / 1000);
      }
      this.accumulator -= this.config.fixedDeltaTime;
    }
    
    this.animationFrameId = requestAnimationFrame(this.loop);
  };
  
  private fixedUpdate(dt: number) {
    const store = useGameStore.getState();
    
    // Update timer
    const newTimer = store.timer - dt;
    if (newTimer <= 0) {
      store.setPhase('ended');
      store.endRun(); // Save mastery progress
      this.stop();
      return;
    }
    store.setTimer(newTimer);
    
    // Update difficulty based on time elapsed
    const elapsed = store.maxTime - newTimer;
    const newDifficulty = 1 + (elapsed / store.maxTime) * 2;
    store.setDifficulty(newDifficulty);
    
    // Check for upgrade time (every 15 seconds)
    if (elapsed - store.lastUpgradeTime >= store.upgradeInterval) {
      store.triggerUpgradeChoice();
      return; // Pause gameplay during upgrade selection
    }
    
    // Track low HP time for Risk Mastery
    if (this.player.hp === 1) {
      store.addLowHpTime(dt);
    }
    
    // Update player
    updatePlayer(this.player, dt, this.config);
    
    // Update camera to follow player
    this.cameraY = Math.max(0, this.player.position.y - this.config.screenHeight / 2);
    
    // Spawn pickups
    if (Math.random() < 0.025 * store.difficulty) {
      const pickup = spawnPickup(this.player.position.y, this.config, store.difficulty);
      this.pickups.push(pickup);
    }
    
    // Spawn hazards
    const newHazards = spawnHazards(this.player.position.y, this.config, store.difficulty);
    this.hazards.push(...newHazards);
    
    // Update pickups
    updatePickups(this.pickups, this.player, dt);
    
    // Update hazards
    updateHazards(this.hazards, this.player, dt);
    
    // Check collisions with mastery tracking
    checkPickupCollisions(this.pickups, this.player, store);
    const collisionResult = checkHazardCollisions(this.hazards, this.player, store);
    
    // Track near misses and phase throughs
    if (collisionResult.nearMisses > 0) {
      for (let i = 0; i < collisionResult.nearMisses; i++) {
        store.addNearMiss();
      }
    }
    if (collisionResult.phaseThroughs > 0) {
      for (let i = 0; i < collisionResult.phaseThroughs; i++) {
        store.addPhaseThrough();
      }
    }
    
    // Clean up off-screen entities
    const cleanupThreshold = this.player.position.y - this.config.screenHeight;
    this.pickups = this.pickups.filter(p => p.position.y > cleanupThreshold && p.active);
    this.hazards = this.hazards.filter(h => h.position.y > cleanupThreshold && h.active);
    
    // Update distance
    store.addDistance(this.player.velocity.y * dt);
  }
  
  handleTouchStart() {
    const store = useGameStore.getState();
    if (store.phase !== 'playing') return;
    this.player.isCharging = true;
  }
  
  handleTouchEnd() {
    const store = useGameStore.getState();
    if (store.phase !== 'playing') return;
    
    if (this.player.charge > 0.1) {
      this.pulse();
    }
    this.player.isCharging = false;
    this.player.charge = 0;
  }
  
  private pulse() {
    const store = useGameStore.getState();
    const chargeRatio = this.player.charge / this.player.maxCharge;
    const currentTime = performance.now() / 1000;
    
    // Check rhythm streak for Timing Mastery
    if (this.lastPulseTime > 0) {
      const timeSinceLastPulse = currentTime - this.lastPulseTime;
      const isGoodRhythm = timeSinceLastPulse >= RHYTHM_WINDOW_MIN && 
                          timeSinceLastPulse <= RHYTHM_WINDOW_MAX;
      store.updateRhythmStreak(isGoodRhythm);
    }
    this.lastPulseTime = currentTime;
    
    // Dash forward (up)
    this.player.velocity.y += this.player.dashPower * chargeRatio;
    
    // Activate phase mode
    this.player.phaseActive = true;
    this.player.phaseTimer = this.player.phaseDuration;
    
    // Magnetize nearby pickups
    this.pickups.forEach(pickup => {
      const dx = pickup.position.x - this.player.position.x;
      const dy = pickup.position.y - this.player.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.player.magnetRange * chargeRatio) {
        pickup.magnetized = true;
      }
    });
    
    // Perfect pulse bonus (charge near max)
    if (chargeRatio > 0.9) {
      store.addPerfectPulse();
      store.addScore(50 * (store.multiplier || 1));
    }
    
    // Add heat
    this.player.heat = Math.min(1, this.player.heat + 0.2);
    
    // Reset charge
    this.player.charge = 0;
  }
  
  getConfig() {
    return this.config;
  }
}
