// Pulse Forge - Main Game Entry Point

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import { GameEngine } from '../src/game/engine';
import { useGameStore } from '../src/game/store';
import { GameCanvas } from '../src/game/GameCanvas';
import { HomeScreen } from '../src/ui/HomeScreen';
import { RunHUD } from '../src/ui/RunHUD';
import { UpgradeModal } from '../src/ui/UpgradeModal';
import { EndScreen } from '../src/ui/EndScreen';
import { Countdown } from '../src/ui/Countdown';
import { Upgrade } from '../src/game/types';
import { resetHazardSpawner } from '../src/game/systems/hazards';

export default function PulseForge() {
  const engineRef = useRef<GameEngine | null>(null);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  
  const { phase, setPhase, startGame, resetGame, selectUpgrade } = useGameStore();

  // Initialize engine
  useEffect(() => {
    const gameEngine = new GameEngine();
    engineRef.current = gameEngine;
    setEngine(gameEngine);
    
    return () => {
      gameEngine.stop();
    };
  }, []);

  const handlePlay = useCallback(() => {
    resetHazardSpawner();
    startGame();
    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [startGame]);

  const handleCountdownComplete = useCallback(() => {
    setPhase('playing');
    engineRef.current?.start();
    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }, [setPhase]);

  const handleSelectUpgrade = useCallback((upgrade: Upgrade) => {
    selectUpgrade(upgrade);
    // Apply upgrade effects to player
    if (engineRef.current?.player) {
      const player = engineRef.current.player;
      upgrade.effects.forEach((effect) => {
        switch (effect.stat) {
          case 'phaseDuration':
            if (effect.modifier === 'add') player.phaseDuration += effect.value;
            else player.phaseDuration *= effect.value;
            break;
          case 'chargeSpeed':
            if (effect.modifier === 'add') player.chargeSpeed += effect.value;
            else player.chargeSpeed *= effect.value;
            break;
          case 'dashPower':
            if (effect.modifier === 'add') player.dashPower += effect.value;
            else player.dashPower *= effect.value;
            break;
          case 'maxHp':
            if (effect.modifier === 'add') {
              player.maxHp += effect.value;
              player.hp += effect.value;
            }
            break;
          case 'magnetRange':
            if (effect.modifier === 'add') player.magnetRange += effect.value;
            else player.magnetRange *= effect.value;
            break;
        }
      });
    }
    // Resume engine
    engineRef.current?.resume();
    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [selectUpgrade]);

  const handleRetry = useCallback(() => {
    resetHazardSpawner();
    engineRef.current?.stop();
    startGame();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [startGame]);

  const handleHome = useCallback(() => {
    engineRef.current?.stop();
    resetGame();
  }, [resetGame]);

  const handleSettings = useCallback(() => {
    // TODO: Implement settings screen
    console.log('Settings pressed');
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a1a" />
      
      {/* Menu Screen */}
      {phase === 'menu' && (
        <HomeScreen onPlay={handlePlay} onSettings={handleSettings} />
      )}

      {/* Game Screen */}
      {(phase === 'countdown' || phase === 'playing' || phase === 'upgrade' || phase === 'ended') && (
        <View style={styles.gameContainer}>
          {/* Game Canvas */}
          <GameCanvas engine={engine} />
          
          {/* HUD Overlay */}
          {(phase === 'playing' || phase === 'upgrade') && (
            <RunHUD player={engine?.player || null} />
          )}
          
          {/* Countdown */}
          {phase === 'countdown' && (
            <Countdown onComplete={handleCountdownComplete} />
          )}
          
          {/* Upgrade Selection */}
          <UpgradeModal
            visible={phase === 'upgrade'}
            onSelect={handleSelectUpgrade}
          />
          
          {/* End Screen */}
          {phase === 'ended' && (
            <View style={styles.endOverlay}>
              <EndScreen onRetry={handleRetry} onHome={handleHome} />
            </View>
          )}
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  gameContainer: {
    flex: 1,
  },
  endOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0a1a',
  },
});
