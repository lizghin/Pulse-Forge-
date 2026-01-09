// Game Canvas using React Native Skia

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { Canvas, Circle, Rect, Group, Text as SkiaText, useFont, LinearGradient, vec, RoundedRect, Paint, Path, Skia, BlurMask } from '@shopify/react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { GameEngine } from './engine';
import { useGameStore } from './store';
import { Player, Pickup, Hazard } from './types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GameCanvasProps {
  engine: GameEngine | null;
}

export function GameCanvas({ engine }: GameCanvasProps) {
  const [, forceUpdate] = useState(0);
  const phase = useGameStore((s) => s.phase);
  const animationRef = useRef<number | null>(null);

  // Render loop
  useEffect(() => {
    const render = () => {
      forceUpdate((n) => n + 1);
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

  const tap = Gesture.Tap()
    .onBegin(() => {
      engine?.handleTouchStart();
    })
    .onEnd(() => {
      engine?.handleTouchEnd();
    });

  const longPress = Gesture.LongPress()
    .minDuration(0)
    .onBegin(() => {
      engine?.handleTouchStart();
    })
    .onEnd(() => {
      engine?.handleTouchEnd();
    });

  const pan = Gesture.Pan()
    .onBegin(() => {
      engine?.handleTouchStart();
    })
    .onEnd(() => {
      engine?.handleTouchEnd();
    });

  const gesture = Gesture.Race(pan, longPress);

  if (!engine) return null;

  const config = engine.getConfig();
  const cameraY = engine.cameraY;

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container}>
        <Canvas style={styles.canvas}>
          {/* Background gradient */}
          <Rect x={0} y={0} width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, SCREEN_HEIGHT)}
              colors={['#0a0a1a', '#1a0a2a', '#0a1a2a']}
            />
          </Rect>

          {/* Grid lines for depth perception */}
          <GridLines cameraY={cameraY} />

          {/* Hazards */}
          {engine.hazards.map((hazard) => (
            <HazardRenderer
              key={hazard.id}
              hazard={hazard}
              cameraY={cameraY}
            />
          ))}

          {/* Pickups */}
          {engine.pickups.map((pickup) => (
            <PickupRenderer
              key={pickup.id}
              pickup={pickup}
              cameraY={cameraY}
            />
          ))}

          {/* Player */}
          <PlayerRenderer player={engine.player} cameraY={cameraY} />
        </Canvas>
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
        <Rect
          key={`h-${i}`}
          x={0}
          y={screenY}
          width={SCREEN_WIDTH}
          height={1}
          color="rgba(100, 100, 255, 0.1)"
        />
      );
    }
  }
  
  // Vertical lines
  for (let i = 0; i < 8; i++) {
    const x = i * (SCREEN_WIDTH / 6);
    lines.push(
      <Rect
        key={`v-${i}`}
        x={x}
        y={0}
        width={1}
        height={SCREEN_HEIGHT}
        color="rgba(100, 100, 255, 0.05)"
      />
    );
  }
  
  return <>{lines}</>;
}

function PlayerRenderer({ player, cameraY }: { player: Player; cameraY: number }) {
  const screenY = player.position.y - cameraY;
  const chargeRatio = player.charge / player.maxCharge;
  const outerRadius = player.radius + chargeRatio * 15;
  
  // Blink when invincible
  const visible = !player.invincible || Math.floor(Date.now() / 100) % 2 === 0;
  
  if (!visible) return null;
  
  return (
    <Group>
      {/* Charge ring */}
      {chargeRatio > 0 && (
        <Circle
          cx={player.position.x}
          cy={screenY}
          r={outerRadius}
          color={`rgba(0, 255, 255, ${0.3 + chargeRatio * 0.4})`}
          style="stroke"
          strokeWidth={3}
        />
      )}
      
      {/* Phase glow */}
      {player.phaseActive && (
        <Circle
          cx={player.position.x}
          cy={screenY}
          r={player.radius + 10}
          color="rgba(255, 0, 255, 0.5)"
        >
          <BlurMask blur={10} style="normal" />
        </Circle>
      )}
      
      {/* Core */}
      <Circle
        cx={player.position.x}
        cy={screenY}
        r={player.radius}
      >
        <LinearGradient
          start={vec(player.position.x - player.radius, screenY - player.radius)}
          end={vec(player.position.x + player.radius, screenY + player.radius)}
          colors={player.phaseActive ? ['#ff00ff', '#aa00ff'] : ['#00ffff', '#0088ff']}
        />
      </Circle>
      
      {/* Inner glow */}
      <Circle
        cx={player.position.x}
        cy={screenY}
        r={player.radius * 0.5}
        color="rgba(255, 255, 255, 0.8)"
      />
    </Group>
  );
}

function PickupRenderer({ pickup, cameraY }: { pickup: Pickup; cameraY: number }) {
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
    <Group>
      {/* Glow */}
      <Circle
        cx={pickup.position.x}
        cy={screenY}
        r={pickup.radius + 5}
        color={`${color}40`}
      >
        <BlurMask blur={8} style="normal" />
      </Circle>
      
      {/* Core */}
      {pickup.type === 'shard' ? (
        <RoundedRect
          x={pickup.position.x - 6}
          y={screenY - 10}
          width={12}
          height={20}
          r={3}
          color={color}
          transform={[{ rotate: Math.PI / 6 }]}
        />
      ) : (
        <Circle
          cx={pickup.position.x}
          cy={screenY}
          r={pickup.radius}
          color={color}
        />
      )}
    </Group>
  );
}

function HazardRenderer({ hazard, cameraY }: { hazard: Hazard; cameraY: number }) {
  if (!hazard.active) return null;
  
  const screenY = hazard.position.y - cameraY;
  
  // Don't render if off screen
  if (screenY < -100 || screenY > SCREEN_HEIGHT + 100) return null;
  
  const color = hazard.phaseable ? '#8844ff' : '#ff4444';
  
  switch (hazard.type) {
    case 'wall':
      return (
        <Group>
          {/* Glow */}
          <RoundedRect
            x={hazard.position.x - 3}
            y={screenY - 3}
            width={(hazard.width || 60) + 6}
            height={(hazard.height || 20) + 6}
            r={5}
            color={`${color}40`}
          >
            <BlurMask blur={5} style="normal" />
          </RoundedRect>
          
          {/* Wall */}
          <RoundedRect
            x={hazard.position.x}
            y={screenY}
            width={hazard.width || 60}
            height={hazard.height || 20}
            r={3}
            color={color}
          />
          
          {/* Pattern for phaseable walls */}
          {hazard.phaseable && (
            <>
              <Rect
                x={hazard.position.x + 5}
                y={screenY + 5}
                width={(hazard.width || 60) - 10}
                height={2}
                color="rgba(255,255,255,0.3)"
              />
              <Rect
                x={hazard.position.x + 5}
                y={screenY + 12}
                width={(hazard.width || 60) - 10}
                height={2}
                color="rgba(255,255,255,0.3)"
              />
            </>
          )}
        </Group>
      );
    case 'drone':
      return (
        <Circle
          cx={hazard.position.x}
          cy={screenY}
          r={hazard.radius}
          color="#ff6600"
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
  },
  canvas: {
    flex: 1,
  },
});
