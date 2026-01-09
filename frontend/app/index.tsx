// Pulse Forge - Main Game Entry with Forge Your Core Feature

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, StatusBar, Platform, TouchableOpacity } from 'react-native';
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

// Debug mode - set to true for development
const DEBUG_MODE = __DEV__ || false;

export default function PulseForge() {
  const engineRef = useRef<GameEngine | null>(null);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [equippedSkin, setEquippedSkin] = useState<SkinRecipe | null>(null);
  const [lastSaveStatus, setLastSaveStatus] = useState<string>('none');
  const [showDebug, setShowDebug] = useState(false);
  
  const { phase, setPhase, startGame, resetGame, selectUpgrade, loadMastery, persistentMastery } = useGameStore();

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
    } else {
      setEquippedSkin(null);
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
          case 'phaseCooldown':
            if (effect.modifier === 'add') player.phaseCooldown += effect.value;
            else player.phaseCooldown *= effect.value;
            break;
          case 'chargeSpeed':
            if (effect.modifier === 'add') player.chargeSpeed += effect.value;
            else player.chargeSpeed *= effect.value;
            break;
          case 'maxCharge':
            if (effect.modifier === 'add') player.maxCharge += effect.value;
            else player.maxCharge *= effect.value;
            break;
          case 'dashForce':
            if (effect.modifier === 'add') player.dashForce += effect.value;
            else player.dashForce *= effect.value;
            break;
          case 'hp':
            if (effect.modifier === 'add') player.hp = Math.min(player.maxHp, player.hp + effect.value);
            else player.hp = Math.min(player.maxHp, Math.floor(player.hp * effect.value));
            break;
          case 'maxHp':
            if (effect.modifier === 'add') player.maxHp += effect.value;
            else player.maxHp = Math.floor(player.maxHp * effect.value);
            player.hp = Math.min(player.maxHp, player.hp);
            break;
          case 'invincibilityTime':
            if (effect.modifier === 'add') player.invincibilityTime += effect.value;
            else player.invincibilityTime *= effect.value;
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
    
    // Wait a moment to ensure any pending endRun() save is complete
    setLastSaveStatus('saving...');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Reload mastery data to ensure we have the latest saved state
    await loadMastery();
    setLastSaveStatus('saved ✓');
    
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

  const handleBackFromUnlocks = useCallback(async () => {
    // Reload mastery when leaving unlocks in case purchases were made
    await loadMastery();
    setCurrentScreen('home');
  }, [loadMastery]);

  const handleBackFromForge = useCallback(() => {
    loadEquippedSkin();
    setCurrentScreen('home');
  }, []);

  const handleBackFromMySkins = useCallback(() => {
    loadEquippedSkin();
    setCurrentScreen('home');
  }, []);

  const handleSkinCreated = useCallback((recipe: SkinRecipe) => {
    setEquippedSkin(recipe);
  }, []);

  const handleSkinEquipped = useCallback(async () => {
    await loadEquippedSkin();
  }, []);

  const handleForgeFromMySkins = useCallback(() => {
    setCurrentScreen('forge');
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a1a" />
      
      {/* Debug Toggle (DEV only) */}
      {DEBUG_MODE && (
        <TouchableOpacity 
          style={styles.debugToggle}
          onPress={() => setShowDebug(!showDebug)}
        >
          <Text style={styles.debugToggleText}>🔧</Text>
        </TouchableOpacity>
      )}
      
      {/* Debug Panel */}
      {DEBUG_MODE && showDebug && (
        <View style={styles.debugPanel}>
          <Text style={styles.debugTitle}>DEBUG INFO</Text>
          <Text style={styles.debugText}>
            Skin: {equippedSkin ? `${equippedSkin.baseShape} (${equippedSkin.id.slice(0,8)}...)` : 'default'}
          </Text>
          <Text style={styles.debugText}>
            Blueprints: {persistentMastery?.blueprints || 0}
          </Text>
          <Text style={styles.debugText}>
            Last Save: {lastSaveStatus}
          </Text>
          <Text style={styles.debugText}>
            Screen: {currentScreen} | Phase: {phase}
          </Text>
        </View>
      )}
      
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
          onSkinEquipped={handleSkinEquipped}
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
  debugToggle: {
    position: 'absolute',
    top: 50,
    right: 10,
    zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debugToggleText: {
    fontSize: 20,
  },
  debugPanel: {
    position: 'absolute',
    top: 100,
    right: 10,
    zIndex: 9998,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#00ff88',
    minWidth: 200,
  },
  debugTitle: {
    color: '#00ff88',
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 6,
  },
  debugText: {
    color: '#fff',
    fontSize: 10,
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
