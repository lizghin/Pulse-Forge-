// Pulse Forge - Main Game Entry Point with Meta-Progression

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
import { UnlocksScreen } from '../src/ui/UnlocksScreen';
import { Upgrade } from '../src/game/types';
import { resetHazardSpawner } from '../src/game/systems/hazards';

type Screen = 'home' | 'game' | 'unlocks';

export default function PulseForge() {
  const engineRef = useRef<GameEngine | null>(null);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  
  const { phase, setPhase, startGame, resetGame, selectUpgrade, loadMastery } = useGameStore();

  // Initialize engine and load mastery
  useEffect(() => {
    const gameEngine = new GameEngine();
    engineRef.current = gameEngine;
    setEngine(gameEngine);
    loadMastery();
    
    return () => {
      gameEngine.stop();
    };
  }, []);

  const handlePlay = useCallback(() => {
    resetHazardSpawner();
    startGame();
    setCurrentScreen('game');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [startGame]);

  const handleCountdownComplete = useCallback(() => {
    setPhase('playing');
    engineRef.current?.start();
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
    engineRef.current?.resume();
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
    setCurrentScreen('home');
  }, [resetGame]);

  const handleSettings = useCallback(() => {
    console.log('Settings pressed');
  }, []);

  const handleUnlocks = useCallback(() => {
    setCurrentScreen('unlocks');
  }, []);

  const handleBackFromUnlocks = useCallback(() => {
    setCurrentScreen('home');
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a1a" />
      
      {/* Home Screen */}
      {currentScreen === 'home' && (
        <HomeScreen 
          onPlay={handlePlay} 
          onSettings={handleSettings} 
          onUnlocks={handleUnlocks}
        />
      )}

      {/* Unlocks Screen */}
      {currentScreen === 'unlocks' && (
        <UnlocksScreen onBack={handleBackFromUnlocks} />
      )}

      {/* Game Screen */}
      {currentScreen === 'game' && (
        <View style={styles.gameContainer}>
          <GameCanvas engine={engine} />
          
          {(phase === 'playing' || phase === 'upgrade') && (
            <RunHUD player={engine?.player || null} />
          )}
          
          {phase === 'countdown' && (
            <Countdown onComplete={handleCountdownComplete} />
          )}
          
          <UpgradeModal
            visible={phase === 'upgrade'}
            onSelect={handleSelectUpgrade}
          />
          
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
