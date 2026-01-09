// Pickup system

import { Pickup, Player, GameConfig } from '../types';

let pickupIdCounter = 0;

export function spawnPickup(playerY: number, config: GameConfig, difficulty: number): Pickup {
  const types: Array<'shard' | 'cell' | 'spark'> = ['shard', 'shard', 'shard', 'cell', 'spark'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  const values = {
    shard: 10,
    cell: 1,
    spark: 1,
  };
  
  return {
    id: `pickup_${++pickupIdCounter}`,
    position: {
      x: Math.random() * (config.screenWidth - 40) + 20,
      y: playerY + config.screenHeight + Math.random() * 200,
    },
    velocity: { x: 0, y: 0 },
    radius: type === 'shard' ? 12 : 15,
    active: true,
    type,
    value: values[type],
    magnetized: false,
  };
}

export function updatePickups(pickups: Pickup[], player: Player, dt: number) {
  pickups.forEach((pickup) => {
    if (!pickup.active) return;
    
    if (pickup.magnetized) {
      // Move toward player
      const dx = player.position.x - pickup.position.x;
      const dy = player.position.y - pickup.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        const speed = 500;
        pickup.velocity.x = (dx / dist) * speed;
        pickup.velocity.y = (dy / dist) * speed;
      }
    }
    
    pickup.position.x += pickup.velocity.x * dt;
    pickup.position.y += pickup.velocity.y * dt;
  });
}

export function checkPickupCollisions(pickups: Pickup[], player: Player, store: any) {
  pickups.forEach((pickup) => {
    if (!pickup.active) return;
    
    const dx = pickup.position.x - player.position.x;
    const dy = pickup.position.y - player.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < player.radius + pickup.radius) {
      pickup.active = false;
      
      switch (pickup.type) {
        case 'shard':
          store.addShards(pickup.value);
          store.addScore(pickup.value * player.multiplier);
          break;
        case 'cell':
          player.hp = Math.min(player.maxHp, player.hp + pickup.value);
          break;
        case 'spark':
          player.multiplier += 0.1;
          break;
      }
    }
  });
}
