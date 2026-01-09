// Run HUD - In-game UI overlay

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../game/store';
import { Player } from '../game/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RunHUDProps {
  player: Player | null;
}

export function RunHUD({ player }: RunHUDProps) {
  const { timer, score, shards, perfectPulses, multiplier } = useGameStore();
  
  const formatTime = (t: number) => {
    const secs = Math.ceil(t);
    return secs.toString().padStart(2, '0');
  };

  return (
    <SafeAreaView style={styles.container} pointerEvents="none">
      {/* Top Bar */}
      <View style={styles.topBar}>
        {/* Timer */}
        <View style={styles.timerContainer}>
          <Ionicons name="time-outline" size={20} color="#00ffff" />
          <Text style={styles.timer}>{formatTime(timer)}</Text>
        </View>

        {/* Score */}
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>{score.toLocaleString()}</Text>
          {(multiplier || 1) > 1 && (
            <Text style={styles.multiplier}>x{(multiplier || 1).toFixed(1)}</Text>
          )}
        </View>
      </View>

      {/* HP */}
      {player && (
        <View style={styles.hpContainer}>
          {Array.from({ length: player.maxHp }).map((_, i) => (
            <Ionicons
              key={i}
              name={i < player.hp ? 'heart' : 'heart-outline'}
              size={24}
              color={i < player.hp ? '#ff4444' : '#444'}
            />
          ))}
        </View>
      )}

      {/* Shards */}
      <View style={styles.shardsContainer}>
        <View style={styles.shardIcon} />
        <Text style={styles.shards}>{shards}</Text>
      </View>

      {/* Charge indicator */}
      {player && player.isCharging && (
        <View style={styles.chargeContainer}>
          <View style={styles.chargeBarBg}>
            <View
              style={[
                styles.chargeBarFill,
                { width: `${(player.charge / player.maxCharge) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.chargeText}>
            {player.charge >= player.maxCharge * 0.9 ? 'PERFECT!' : 'CHARGING...'}
          </Text>
        </View>
      )}

      {/* Phase indicator */}
      {player && player.phaseActive && (
        <View style={styles.phaseIndicator}>
          <Text style={styles.phaseText}>PHASE ACTIVE</Text>
        </View>
      )}

      {/* Perfect pulse counter */}
      {perfectPulses > 0 && (
        <View style={styles.perfectContainer}>
          <Ionicons name="flash" size={16} color="#ffaa00" />
          <Text style={styles.perfectText}>{perfectPulses}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  timer: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00ffff',
    fontVariant: ['tabular-nums'],
  },
  scoreContainer: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  score: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  multiplier: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffaa00',
  },
  hpContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 4,
  },
  shardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  shardIcon: {
    width: 12,
    height: 18,
    backgroundColor: '#00ff88',
    borderRadius: 3,
    transform: [{ rotate: '15deg' }],
  },
  shards: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00ff88',
  },
  chargeContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  chargeBarBg: {
    width: SCREEN_WIDTH * 0.6,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  chargeBarFill: {
    height: '100%',
    backgroundColor: '#00ffff',
    borderRadius: 4,
  },
  chargeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00ffff',
    marginTop: 6,
  },
  phaseIndicator: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  phaseText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ff00ff',
    letterSpacing: 2,
  },
  perfectContainer: {
    position: 'absolute',
    top: 80,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  perfectText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffaa00',
  },
});
