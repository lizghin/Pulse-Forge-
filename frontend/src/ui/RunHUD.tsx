// Run HUD - In-game UI overlay with Mastery Event Indicators

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useGameStore } from '../game/store';
import { Player, MasteryEvent } from '../game/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RunHUDProps {
  player: Player | null;
}

export function RunHUD({ player }: RunHUDProps) {
  const { timer, score, shards, perfectPulses, masteryStats, recentEvents } = useGameStore();
  const [displayedEvents, setDisplayedEvents] = useState<MasteryEvent[]>([]);
  
  // Track displayed events to show new ones
  useEffect(() => {
    if (recentEvents.length > 0) {
      const latestEvent = recentEvents[recentEvents.length - 1];
      // Only show events from last 3 seconds
      if (Date.now() - latestEvent.timestamp < 3000) {
        setDisplayedEvents(prev => {
          // Keep only last 3 events
          const newEvents = [...prev, latestEvent].slice(-3);
          return newEvents;
        });
        // Remove after animation
        setTimeout(() => {
          setDisplayedEvents(prev => prev.filter(e => e.id !== latestEvent.id));
        }, 2000);
      }
    }
  }, [recentEvents]);
  
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
          <Ionicons name="time-outline" size={18} color="#00ffff" />
          <Text style={styles.timer}>{formatTime(timer)}</Text>
        </View>

        {/* Score */}
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>{score.toLocaleString()}</Text>
        </View>
      </View>

      {/* HP & Streaks */}
      <View style={styles.secondRow}>
        {player && (
          <View style={styles.hpContainer}>
            {Array.from({ length: player.maxHp }).map((_, i) => (
              <Ionicons
                key={i}
                name={i < player.hp ? 'heart' : 'heart-outline'}
                size={20}
                color={i < player.hp ? '#ff4444' : '#444'}
              />
            ))}
          </View>
        )}
        
        {/* Rhythm Streak */}
        {masteryStats.rhythmStreak >= 2 && (
          <View style={styles.streakContainer}>
            <Ionicons name="musical-notes" size={14} color="#ffaa00" />
            <Text style={styles.streakText}>x{masteryStats.rhythmStreak}</Text>
          </View>
        )}
      </View>

      {/* Shards */}
      <View style={styles.shardsContainer}>
        <View style={styles.shardIcon} />
        <Text style={styles.shards}>{shards}</Text>
      </View>

      {/* Mastery Indicators (top right) */}
      <View style={styles.masteryIndicators}>
        {perfectPulses > 0 && (
          <View style={[styles.indicator, styles.timingIndicator]}>
            <Ionicons name="flash" size={14} color="#ffaa00" />
            <Text style={styles.indicatorText}>{perfectPulses}</Text>
          </View>
        )}
        {masteryStats.nearMisses > 0 && (
          <View style={[styles.indicator, styles.riskIndicator]}>
            <Ionicons name="flame" size={14} color="#ff4444" />
            <Text style={styles.indicatorText}>{masteryStats.nearMisses}</Text>
          </View>
        )}
        {masteryStats.categoriesUsed.size > 0 && (
          <View style={[styles.indicator, styles.buildIndicator]}>
            <Ionicons name="construct" size={14} color="#00aaff" />
            <Text style={styles.indicatorText}>{masteryStats.categoriesUsed.size}</Text>
          </View>
        )}
      </View>

      {/* Mastery Event Popups */}
      <View style={styles.eventContainer}>
        {displayedEvents.map((event, index) => (
          <MasteryEventPopup key={event.id} event={event} index={index} />
        ))}
      </View>

      {/* Charge indicator */}
      {player && player.isCharging && (
        <View style={styles.chargeContainer}>
          <View style={styles.chargeBarBg}>
            <View
              style={[
                styles.chargeBarFill,
                { 
                  width: `${(player.charge / player.maxCharge) * 100}%`,
                  backgroundColor: player.charge >= player.maxCharge * 0.9 ? '#ffaa00' : '#00ffff',
                },
              ]}
            />
          </View>
          <Text style={[
            styles.chargeText,
            player.charge >= player.maxCharge * 0.9 && styles.chargeTextPerfect
          ]}>
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
      
      {/* Low HP Warning */}
      {player && player.hp === 1 && (
        <View style={styles.lowHpWarning}>
          <Ionicons name="warning" size={16} color="#ff4444" />
          <Text style={styles.lowHpText}>DANGER - Risk XP Active!</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// Mastery Event Popup Component
function MasteryEventPopup({ event, index }: { event: MasteryEvent; index: number }) {
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  
  useEffect(() => {
    translateY.value = withSequence(
      withTiming(-10 - index * 30, { duration: 200 }),
      withDelay(1500, withTiming(-50, { duration: 300 }))
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(1500, withTiming(0, { duration: 300 }))
    );
    scale.value = withSequence(
      withTiming(1.1, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  }, []);
  
  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));
  
  const getEventDisplay = () => {
    switch (event.type) {
      case 'perfect_pulse':
        return { icon: 'flash', color: '#ffaa00', text: 'PERFECT PULSE!' };
      case 'near_miss':
        return { icon: 'flame', color: '#ff4444', text: 'NEAR MISS!' };
      case 'rhythm_streak':
        return { icon: 'musical-notes', color: '#ffaa00', text: `STREAK x${event.value}!` };
      case 'phase_through':
        return { icon: 'flash-outline', color: '#ff00ff', text: 'PHASE THROUGH!' };
      case 'low_hp_bonus':
        return { icon: 'skull', color: '#ff4444', text: `${event.value}s LOW HP!` };
      case 'category_bonus':
        return { icon: 'star', color: '#00aaff', text: 'ALL CATEGORIES!' };
      default:
        return { icon: 'star', color: '#fff', text: 'BONUS!' };
    }
  };
  
  const display = getEventDisplay();
  
  return (
    <Animated.View style={[styles.eventPopup, { borderColor: display.color }, animStyle]}>
      <Ionicons name={display.icon as any} size={16} color={display.color} />
      <Text style={[styles.eventText, { color: display.color }]}>{display.text}</Text>
    </Animated.View>
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  timer: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00ffff',
    fontVariant: ['tabular-nums'],
  },
  scoreContainer: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  score: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  secondRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  hpContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,170,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffaa00',
  },
  shardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  shardIcon: {
    width: 10,
    height: 16,
    backgroundColor: '#00ff88',
    borderRadius: 2,
    transform: [{ rotate: '15deg' }],
  },
  shards: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00ff88',
  },
  masteryIndicators: {
    position: 'absolute',
    top: 70,
    right: 16,
    gap: 6,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  timingIndicator: {
    backgroundColor: 'rgba(255,170,0,0.2)',
  },
  riskIndicator: {
    backgroundColor: 'rgba(255,68,68,0.2)',
  },
  buildIndicator: {
    backgroundColor: 'rgba(0,170,255,0.2)',
  },
  indicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  eventContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  eventPopup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    gap: 8,
    marginBottom: 4,
  },
  eventText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
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
    borderRadius: 4,
  },
  chargeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00ffff',
    marginTop: 6,
  },
  chargeTextPerfect: {
    color: '#ffaa00',
  },
  phaseIndicator: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  phaseText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ff00ff',
    letterSpacing: 2,
  },
  lowHpWarning: {
    position: 'absolute',
    top: 120,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,68,68,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  lowHpText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ff4444',
  },
});
