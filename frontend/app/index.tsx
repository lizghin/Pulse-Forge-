// Pulse Forge - Main Game Entry with Forge Your Core Feature

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
import { ForgeSkinScreen } from '../src/forge/ForgeSkinScreen';
import { MySkinsScreen } from '../src/forge/MySkinsScreen';
import { Upgrade, SkinRecipe } from '../src/game/types';
import { resetHazardSpawner } from '../src/game/systems/hazards';
import { getEquippedSkin, loadForgedSkins } from '../src/forge/skinForge';

type Screen = 'home' | 'game' | 'unlocks' | 'forge' | 'myskins';

export default function PulseForge() {
  const engineRef = useRef<GameEngine | null>(null);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [equippedSkin, setEquippedSkin] = useState<SkinRecipe | null>(null);
  
  const { phase, setPhase, startGame, resetGame, selectUpgrade, loadMastery } = useGameStore();

  // Initialize engine and load data
  useEffect(() => {
    const gameEngine = new GameEngine();
    engineRef.current = gameEngine;
    setEngine(gameEngine);
    loadMastery();
    loadEquippedSkin();
    
    return () => {
      gameEngine.stop();
    };
  }, []);

  const loadEquippedSkin = async () => {
    const equippedId = await getEquippedSkin();
    if (equippedId) {
      const skins = await loadForgedSkins();
      const skin = skins.find(s => s.id === equippedId);
      setEquippedSkin(skin || null);
    }
  };

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

  const handleHome = useCallback(async () => {
    engineRef.current?.stop();
    // Ensure mastery data is saved before navigating
    // The endRun() should already be complete, but reload to ensure fresh data
    await loadMastery();
    resetGame();
    setCurrentScreen('home');
  }, [resetGame, loadMastery]);

  const handleSettings = useCallback(() => {
    console.log('Settings pressed');
  }, []);

  const handleUnlocks = useCallback(() => {
    setCurrentScreen('unlocks');
  }, []);

  const handleForge = useCallback(() => {
    setCurrentScreen('forge');
  }, []);

  const handleMySkins = useCallback(() => {
    setCurrentScreen('myskins');
  }, []);

  const handleBackFromUnlocks = useCallback(() => {
    setCurrentScreen('home');
  }, []);

  const handleBackFromForge = useCallback(() => {
    setCurrentScreen('home');
  }, []);

  const handleBackFromMySkins = useCallback(() => {
    setCurrentScreen('home');
  }, []);

  const handleSkinCreated = useCallback((recipe: SkinRecipe) => {
    setEquippedSkin(recipe);
  }, []);

  const handleForgeFromMySkins = useCallback(() => {
    setCurrentScreen('forge');
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
          onForge={handleForge}
          onMySkins={handleMySkins}
        />
      )}

      {/* Unlocks Screen */}
      {currentScreen === 'unlocks' && (
        <UnlocksScreen onBack={handleBackFromUnlocks} />
      )}

      {/* Forge Skin Screen */}
      {currentScreen === 'forge' && (
        <ForgeSkinScreen 
          onBack={handleBackFromForge} 
          onSkinCreated={handleSkinCreated}
        />
      )}

      {/* My Skins Screen */}
      {currentScreen === 'myskins' && (
        <MySkinsScreen 
          onBack={handleBackFromMySkins}
          onForgeNew={handleForgeFromMySkins}
        />
      )}

      {/* Game Screen */}
      {currentScreen === 'game' && (
        <View style={styles.gameContainer}>
          <GameCanvas engine={engine} equippedSkin={equippedSkin} />
          
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
