// Game Canvas using React Native Views
// Renders player, pickups, and all hazard types (walls, drones, lasers)

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { GameEngine } from './engine';
import { useGameStore } from './store';
import { Player, Pickup, Hazard, SkinRecipe } from './types';
import { LinearGradient } from 'expo-linear-gradient';
import { SkinPreview, getSkinColors } from '../forge/SkinPreview';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GameCanvasProps {
  engine: GameEngine | null;
  equippedSkin?: SkinRecipe | null;
}

export function GameCanvas({ engine, equippedSkin }: GameCanvasProps) {
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

        {/* Hazards (render lasers first so they appear behind) */}
        {engine.hazards
          .filter(h => h.type === 'laser')
          .map((hazard) => (
            <HazardView key={hazard.id} hazard={hazard} cameraY={cameraY} />
          ))}
        
        {/* Walls */}
        {engine.hazards
          .filter(h => h.type === 'wall')
          .map((hazard) => (
            <HazardView key={hazard.id} hazard={hazard} cameraY={cameraY} />
          ))}
        
        {/* Drones */}
        {engine.hazards
          .filter(h => h.type === 'drone')
          .map((hazard) => (
            <HazardView key={hazard.id} hazard={hazard} cameraY={cameraY} />
          ))}

        {/* Pickups */}
        {engine.pickups.map((pickup) => (
          <PickupView key={pickup.id} pickup={pickup} cameraY={cameraY} />
        ))}

        {/* Player */}
        <PlayerView player={engine.player} cameraY={cameraY} equippedSkin={equippedSkin} />
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
  
  // Don't render if off screen (with buffer for lasers)
  if (screenY < -150 || screenY > SCREEN_HEIGHT + 150) return null;
  
  switch (hazard.type) {
    case 'wall':
      return <WallView hazard={hazard} screenY={screenY} />;
    case 'drone':
      return <DroneView hazard={hazard} screenY={screenY} />;
    case 'laser':
      return <LaserView hazard={hazard} screenY={screenY} />;
    default:
      return null;
  }
}

// WALL HAZARD
function WallView({ hazard, screenY }: { hazard: Hazard; screenY: number }) {
  const color = hazard.phaseable ? '#8844ff' : '#ff4444';
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
}

// DRONE HAZARD
function DroneView({ hazard, screenY }: { hazard: Hazard; screenY: number }) {
  const isTelegraphing = hazard.telegraphed && (hazard.telegraphTimer ?? 0) > 0;
  const baseColor = hazard.phaseable ? '#aa44ff' : '#ff6600';
  
  // Pulsing effect for telegraph
  const pulseOpacity = isTelegraphing 
    ? 0.3 + Math.sin(Date.now() / 100) * 0.3 
    : 1;
  
  return (
    <View
      style={[
        styles.droneContainer,
        {
          left: hazard.position.x - hazard.radius - 8,
          top: screenY - hazard.radius - 8,
          width: (hazard.radius + 8) * 2,
          height: (hazard.radius + 8) * 2,
        },
      ]}
    >
      {/* Telegraph glow (pulsing warning) */}
      {isTelegraphing && (
        <View
          style={[
            styles.droneTelegraph,
            {
              backgroundColor: baseColor,
              opacity: pulseOpacity,
            },
          ]}
        />
      )}
      
      {/* Outer ring */}
      <View
        style={[
          styles.droneRing,
          {
            borderColor: baseColor,
            opacity: isTelegraphing ? 0.5 : 1,
          },
        ]}
      />
      
      {/* Core */}
      <View
        style={[
          styles.droneCore,
          {
            width: hazard.radius * 2 - 8,
            height: hazard.radius * 2 - 8,
            backgroundColor: baseColor,
            opacity: isTelegraphing ? 0.6 : 1,
          },
        ]}
      />
      
      {/* Eye/center */}
      <View style={styles.droneEye} />
      
      {/* Phaseable indicator */}
      {hazard.phaseable && (
        <View style={styles.dronePhaseIndicator} />
      )}
    </View>
  );
}

// LASER HAZARD
function LaserView({ hazard, screenY }: { hazard: Hazard; screenY: number }) {
  const isTelegraphing = hazard.telegraphTimer !== undefined && hazard.telegraphTimer > 0;
  const isActive = hazard.telegraphTimer !== undefined && hazard.telegraphTimer < 0;
  
  const width = hazard.width || SCREEN_WIDTH;
  const height = hazard.height || 12;
  
  // Flash effect for active laser
  const flashIntensity = isActive 
    ? 0.8 + Math.sin(Date.now() / 30) * 0.2 
    : 0;
  
  return (
    <View
      style={[
        styles.laserContainer,
        {
          left: hazard.position.x,
          top: screenY - height / 2 - 10,
          width,
          height: height + 20,
        },
      ]}
    >
      {/* Telegraph line (warning) */}
      {isTelegraphing && (
        <>
          <View style={[styles.laserTelegraphLine, { height: 2 }]} />
          <View style={[styles.laserTelegraphGlow, { height: 8 }]} />
          {/* Warning markers */}
          <View style={styles.laserWarningLeft}>
            <View style={styles.warningTriangle} />
          </View>
          <View style={styles.laserWarningRight}>
            <View style={styles.warningTriangle} />
          </View>
        </>
      )}
      
      {/* Active beam */}
      {isActive && (
        <>
          {/* Core beam */}
          <View 
            style={[
              styles.laserBeam,
              { 
                height,
                backgroundColor: '#ff0044',
                opacity: flashIntensity,
              },
            ]} 
          />
          {/* Outer glow */}
          <View 
            style={[
              styles.laserGlow,
              { 
                height: height + 8,
                opacity: flashIntensity * 0.5,
              },
            ]} 
          />
          {/* Inner bright core */}
          <View 
            style={[
              styles.laserCore,
              { 
                height: height / 2,
              },
            ]} 
          />
        </>
      )}
    </View>
  );
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
  // WALL STYLES
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
  // DRONE STYLES
  droneContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  droneTelegraph: {
    position: 'absolute',
    width: '150%',
    height: '150%',
    borderRadius: 999,
  },
  droneRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 3,
  },
  droneCore: {
    borderRadius: 999,
  },
  droneEye: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  dronePhaseIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 16,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 2,
  },
  // LASER STYLES
  laserContainer: {
    position: 'absolute',
    justifyContent: 'center',
  },
  laserTelegraphLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#ff0044',
    opacity: 0.8,
    alignSelf: 'center',
  },
  laserTelegraphGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#ff0044',
    opacity: 0.2,
    alignSelf: 'center',
  },
  laserWarningLeft: {
    position: 'absolute',
    left: 5,
    alignSelf: 'center',
  },
  laserWarningRight: {
    position: 'absolute',
    right: 5,
    alignSelf: 'center',
  },
  warningTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#ff0044',
  },
  laserBeam: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignSelf: 'center',
  },
  laserGlow: {
    position: 'absolute',
    left: -4,
    right: -4,
    backgroundColor: '#ff0044',
    alignSelf: 'center',
  },
  laserCore: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    alignSelf: 'center',
  },
});
