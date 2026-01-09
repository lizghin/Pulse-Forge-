// Game Canvas using React Native Views
// Simple approach that works on web and native

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { GameEngine } from './engine';
import { useGameStore } from './store';
import { Player, Pickup, Hazard } from './types';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GameCanvasProps {
  engine: GameEngine | null;
}

export function GameCanvas({ engine }: GameCanvasProps) {
  const [renderTick, setRenderTick] = useState(0);
  const phase = useGameStore((s) => s.phase);
  const animationRef = useRef<number | null>(null);

  // Render loop
  useEffect(() => {
    const render = () => {
      setRenderTick((n) => n + 1);
      animationRef.current = requestAnimationFrame(render);
    };
    
    if (phase === 'playing' || phase === 'countdown') {
      render();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [phase]);

  const pan = Gesture.Pan()
    .onBegin(() => {
      engine?.handleTouchStart();
    })
    .onEnd(() => {
      engine?.handleTouchEnd();
    });

  const tap = Gesture.Tap()
    .onBegin(() => {
      engine?.handleTouchStart();
    })
    .onEnd(() => {
      engine?.handleTouchEnd();
    });

  const gesture = Gesture.Race(pan, tap);

  if (!engine) return null;

  const config = engine.getConfig();
  const cameraY = engine.cameraY;

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container}>
        {/* Background gradient */}
        <LinearGradient
          colors={['#0a0a1a', '#1a0a2a', '#0a1a2a']}
          style={StyleSheet.absoluteFill}
        />

        {/* Grid lines */}
        <GridLines cameraY={cameraY} />

        {/* Hazards */}
        {engine.hazards.map((hazard) => (
          <HazardView key={hazard.id} hazard={hazard} cameraY={cameraY} />
        ))}

        {/* Pickups */}
        {engine.pickups.map((pickup) => (
          <PickupView key={pickup.id} pickup={pickup} cameraY={cameraY} />
        ))}

        {/* Player */}
        <PlayerView player={engine.player} cameraY={cameraY} />
      </View>
    </GestureDetector>
  );
}

function GridLines({ cameraY }: { cameraY: number }) {
  const lines = [];
  const spacing = 80;
  const startY = Math.floor(cameraY / spacing) * spacing;
  
  for (let i = 0; i < 15; i++) {
    const worldY = startY + i * spacing;
    const screenY = worldY - cameraY;
    
    if (screenY >= -spacing && screenY <= SCREEN_HEIGHT + spacing) {
      lines.push(
        <View
          key={`h-${worldY}`}
          style={[
            styles.gridLineH,
            { top: screenY },
          ]}
        />
      );
    }
  }
  
  // Vertical lines
  for (let i = 0; i < 8; i++) {
    const x = i * (SCREEN_WIDTH / 6);
    lines.push(
      <View
        key={`v-${i}`}
        style={[
          styles.gridLineV,
          { left: x },
        ]}
      />
    );
  }
  
  return <>{lines}</>;
}

function PlayerView({ player, cameraY }: { player: Player; cameraY: number }) {
  const screenY = player.position.y - cameraY;
  const chargeRatio = player.charge / player.maxCharge;
  const outerRadius = player.radius + chargeRatio * 15;
  
  // Blink when invincible
  const visible = !player.invincible || Math.floor(Date.now() / 100) % 2 === 0;
  
  if (!visible) return null;
  
  const baseColor = player.phaseActive ? '#ff00ff' : '#00ffff';
  
  return (
    <View
      style={[
        styles.playerContainer,
        {
          left: player.position.x - outerRadius,
          top: screenY - outerRadius,
          width: outerRadius * 2,
          height: outerRadius * 2,
        },
      ]}
    >
      {/* Charge ring */}
      {chargeRatio > 0 && (
        <View
          style={[
            styles.chargeRing,
            {
              borderColor: baseColor,
              opacity: 0.3 + chargeRatio * 0.4,
            },
          ]}
        />
      )}
      
      {/* Phase glow */}
      {player.phaseActive && (
        <View style={styles.phaseGlow} />
      )}
      
      {/* Core */}
      <View
        style={[
          styles.playerCore,
          {
            width: player.radius * 2,
            height: player.radius * 2,
            backgroundColor: baseColor,
          },
        ]}
      />
      
      {/* Inner glow */}
      <View style={styles.playerInnerGlow} />
    </View>
  );
}

function PickupView({ pickup, cameraY }: { pickup: Pickup; cameraY: number }) {
  if (!pickup.active) return null;
  
  const screenY = pickup.position.y - cameraY;
  
  // Don't render if off screen
  if (screenY < -50 || screenY > SCREEN_HEIGHT + 50) return null;
  
  const colors = {
    shard: '#00ff88',
    cell: '#ff4444',
    spark: '#ffff00',
  };
  
  const color = colors[pickup.type];
  
  return (
    <View
      style={[
        styles.pickupContainer,
        {
          left: pickup.position.x - pickup.radius,
          top: screenY - pickup.radius,
        },
      ]}
    >
      {/* Glow */}
      <View
        style={[
          styles.pickupGlow,
          {
            width: (pickup.radius + 5) * 2,
            height: (pickup.radius + 5) * 2,
            backgroundColor: color,
          },
        ]}
      />
      
      {/* Core */}
      {pickup.type === 'shard' ? (
        <View
          style={[
            styles.shardShape,
            { backgroundColor: color },
          ]}
        />
      ) : (
        <View
          style={[
            styles.pickupCore,
            {
              width: pickup.radius * 2,
              height: pickup.radius * 2,
              backgroundColor: color,
            },
          ]}
        />
      )}
    </View>
  );
}

function HazardView({ hazard, cameraY }: { hazard: Hazard; cameraY: number }) {
  if (!hazard.active) return null;
  
  const screenY = hazard.position.y - cameraY;
  
  // Don't render if off screen
  if (screenY < -100 || screenY > SCREEN_HEIGHT + 100) return null;
  
  const color = hazard.phaseable ? '#8844ff' : '#ff4444';
  
  switch (hazard.type) {
    case 'wall':
      const width = hazard.width || 60;
      const height = hazard.height || 20;
      return (
        <View
          style={[
            styles.wallContainer,
            {
              left: hazard.position.x,
              top: screenY,
              width,
              height,
            },
          ]}
        >
          {/* Glow */}
          <View
            style={[
              styles.wallGlow,
              { backgroundColor: color },
            ]}
          />
          
          {/* Wall body */}
          <View
            style={[
              styles.wallBody,
              { backgroundColor: color },
            ]}
          />
          
          {/* Pattern for phaseable walls */}
          {hazard.phaseable && (
            <>
              <View style={[styles.wallStripe, { top: 5 }]} />
              <View style={[styles.wallStripe, { top: 12 }]} />
            </>
          )}
        </View>
      );
    case 'drone':
      return (
        <View
          style={[
            styles.droneBody,
            {
              left: hazard.position.x - hazard.radius,
              top: screenY - hazard.radius,
              width: hazard.radius * 2,
              height: hazard.radius * 2,
            },
          ]}
        />
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    overflow: 'hidden',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(100, 100, 255, 0.1)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(100, 100, 255, 0.05)',
  },
  playerContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chargeRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 3,
  },
  phaseGlow: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 0, 255, 0.3)',
  },
  playerCore: {
    borderRadius: 999,
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  playerInnerGlow: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  pickupContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupGlow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.3,
  },
  pickupCore: {
    borderRadius: 999,
  },
  shardShape: {
    width: 12,
    height: 20,
    borderRadius: 3,
    transform: [{ rotate: '15deg' }],
  },
  wallContainer: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: 5,
  },
  wallGlow: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 8,
    opacity: 0.3,
  },
  wallBody: {
    flex: 1,
    borderRadius: 3,
  },
  wallStripe: {
    position: 'absolute',
    left: 5,
    right: 5,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  droneBody: {
    position: 'absolute',
    backgroundColor: '#ff6600',
    borderRadius: 999,
  },
});
