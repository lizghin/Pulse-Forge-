// End Screen with Blueprints & Mastery Progress

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useGameStore } from '../game/store';
import { 
  getMasteryLevel, 
  getMasteryProgressToNext, 
  calculateRunMasteryXP,
  MASTERY_TRACKS 
} from '../game/mastery';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EndScreenProps {
  onRetry: () => void;
  onHome: () => void;
}

export function EndScreen({ onRetry, onHome }: EndScreenProps) {
  const { 
    score, 
    shards, 
    perfectPulses, 
    distance, 
    selectedUpgrades,
    masteryStats,
    persistentMastery,
    newUnlocks,
    runRewards,
  } = useGameStore();
  
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  
  const xpGained = calculateRunMasteryXP(masteryStats);
  
  // Animation values
  const timingProgress = useSharedValue(0);
  const riskProgress = useSharedValue(0);
  const buildProgress = useSharedValue(0);
  const blueprintCount = useSharedValue(0);
  const unlockScale = useSharedValue(0);
  
  useEffect(() => {
    const timingTarget = getMasteryProgressToNext(persistentMastery.progress.timing);
    const riskTarget = getMasteryProgressToNext(persistentMastery.progress.risk);
    const buildTarget = getMasteryProgressToNext(persistentMastery.progress.build);
    
    timingProgress.value = withDelay(300, withTiming(timingTarget, { duration: 800 }));
    riskProgress.value = withDelay(500, withTiming(riskTarget, { duration: 800 }));
    buildProgress.value = withDelay(700, withTiming(buildTarget, { duration: 800 }));
    
    // Animate blueprint counter
    if (runRewards) {
      blueprintCount.value = withDelay(900, withTiming(runRewards.totalBlueprints, { duration: 1000 }));
    }
    
    if (newUnlocks.length > 0) {
      setTimeout(() => {
        setShowUnlockModal(true);
        unlockScale.value = withSequence(
          withSpring(1.1, { damping: 8 }),
          withSpring(1, { damping: 12 })
        );
      }, 1500);
    }
  }, []);
  
  const timingAnimStyle = useAnimatedStyle(() => ({
    width: `${timingProgress.value * 100}%`,
  }));
  
  const riskAnimStyle = useAnimatedStyle(() => ({
    width: `${riskProgress.value * 100}%`,
  }));
  
  const buildAnimStyle = useAnimatedStyle(() => ({
    width: `${buildProgress.value * 100}%`,
  }));
  
  const unlockAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: unlockScale.value }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>RUN COMPLETE</Text>

        {/* Score */}
        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>CORE SCORE</Text>
          <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
        </View>

        {/* Blueprint Rewards */}
        {runRewards && (
          <View style={styles.blueprintSection}>
            <View style={styles.blueprintHeader}>
              <Ionicons name="cube" size={24} color="#00aaff" />
              <Text style={styles.blueprintTitle}>BLUEPRINTS EARNED</Text>
            </View>
            <Text style={styles.blueprintTotal}>+{runRewards.totalBlueprints}</Text>
            <View style={styles.blueprintBreakdown}>
              <View style={styles.bpItem}>
                <Text style={styles.bpLabel}>Base</Text>
                <Text style={styles.bpValue}>+{runRewards.baseBlueprints}</Text>
              </View>
              {runRewards.timingBonus > 0 && (
                <View style={styles.bpItem}>
                  <Ionicons name="flash" size={14} color="#ffaa00" />
                  <Text style={[styles.bpValue, { color: '#ffaa00' }]}>+{runRewards.timingBonus}</Text>
                </View>
              )}
              {runRewards.riskBonus > 0 && (
                <View style={styles.bpItem}>
                  <Ionicons name="flame" size={14} color="#ff4444" />
                  <Text style={[styles.bpValue, { color: '#ff4444' }]}>+{runRewards.riskBonus}</Text>
                </View>
              )}
              {runRewards.buildBonus > 0 && (
                <View style={styles.bpItem}>
                  <Ionicons name="construct" size={14} color="#00aaff" />
                  <Text style={[styles.bpValue, { color: '#00aaff' }]}>+{runRewards.buildBonus}</Text>
                </View>
              )}
            </View>
            <Text style={styles.totalBlueprints}>
              Total: {persistentMastery.blueprints} Blueprints
            </Text>
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(0,255,136,0.2)' }]}>
              <View style={styles.shardIconSmall} />
            </View>
            <Text style={styles.statValue}>{shards}</Text>
            <Text style={styles.statLabel}>Shards</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(255,170,0,0.2)' }]}>
              <Ionicons name="flash" size={20} color="#ffaa00" />
            </View>
            <Text style={styles.statValue}>{perfectPulses}</Text>
            <Text style={styles.statLabel}>Perfect</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(255,68,68,0.2)' }]}>
              <Ionicons name="flame" size={20} color="#ff4444" />
            </View>
            <Text style={styles.statValue}>{masteryStats.nearMisses}</Text>
            <Text style={styles.statLabel}>Near Miss</Text>
          </View>
        </View>

        {/* Mastery Progress */}
        <View style={styles.masterySection}>
          <Text style={styles.sectionTitle}>MASTERY PROGRESS</Text>
          
          {/* Timing */}
          <View style={styles.masteryTrack}>
            <View style={styles.masteryHeader}>
              <View style={styles.masteryLabel}>
                <Ionicons name="flash" size={16} color={MASTERY_TRACKS.timing.color} />
                <Text style={[styles.masteryName, { color: MASTERY_TRACKS.timing.color }]}>
                  {MASTERY_TRACKS.timing.name}
                </Text>
              </View>
              <View style={styles.masteryXp}>
                <Text style={styles.xpGained}>+{xpGained.timing} XP</Text>
                <Text style={styles.masteryLevel}>
                  Lv.{getMasteryLevel(persistentMastery.progress.timing)}
                </Text>
              </View>
            </View>
            <View style={styles.progressBarBg}>
              <Animated.View 
                style={[
                  styles.progressBarFill, 
                  { backgroundColor: MASTERY_TRACKS.timing.color },
                  timingAnimStyle
                ]} 
              />
            </View>
          </View>
          
          {/* Risk */}
          <View style={styles.masteryTrack}>
            <View style={styles.masteryHeader}>
              <View style={styles.masteryLabel}>
                <Ionicons name="flame" size={16} color={MASTERY_TRACKS.risk.color} />
                <Text style={[styles.masteryName, { color: MASTERY_TRACKS.risk.color }]}>
                  {MASTERY_TRACKS.risk.name}
                </Text>
              </View>
              <View style={styles.masteryXp}>
                <Text style={styles.xpGained}>+{xpGained.risk} XP</Text>
                <Text style={styles.masteryLevel}>
                  Lv.{getMasteryLevel(persistentMastery.progress.risk)}
                </Text>
              </View>
            </View>
            <View style={styles.progressBarBg}>
              <Animated.View 
                style={[
                  styles.progressBarFill, 
                  { backgroundColor: MASTERY_TRACKS.risk.color },
                  riskAnimStyle
                ]} 
              />
            </View>
          </View>
          
          {/* Build */}
          <View style={styles.masteryTrack}>
            <View style={styles.masteryHeader}>
              <View style={styles.masteryLabel}>
                <Ionicons name="construct" size={16} color={MASTERY_TRACKS.build.color} />
                <Text style={[styles.masteryName, { color: MASTERY_TRACKS.build.color }]}>
                  {MASTERY_TRACKS.build.name}
                </Text>
              </View>
              <View style={styles.masteryXp}>
                <Text style={styles.xpGained}>+{xpGained.build} XP</Text>
                <Text style={styles.masteryLevel}>
                  Lv.{getMasteryLevel(persistentMastery.progress.build)}
                </Text>
              </View>
            </View>
            <View style={styles.progressBarBg}>
              <Animated.View 
                style={[
                  styles.progressBarFill, 
                  { backgroundColor: MASTERY_TRACKS.build.color },
                  buildAnimStyle
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Build Recap */}
        {selectedUpgrades.length > 0 && (
          <View style={styles.buildSection}>
            <Text style={styles.sectionTitle}>BUILD RECAP</Text>
            <View style={styles.upgradesList}>
              {selectedUpgrades.map((upgrade, index) => (
                <View key={upgrade.id} style={styles.upgradeItem}>
                  <Text style={styles.upgradeNumber}>{index + 1}</Text>
                  <Text style={styles.upgradeName}>{upgrade.name}</Text>
                  <Text style={styles.upgradeCategory}>{upgrade.category}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.categoriesUsed}>
              {masteryStats.categoriesUsed.size}/5 categories
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
            <Ionicons name="refresh" size={22} color="#0a0a1a" />
            <Text style={styles.retryText}>RETRY</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.homeButton} onPress={onHome} activeOpacity={0.8}>
            <Ionicons name="home-outline" size={22} color="#888" />
            <Text style={styles.homeText}>HOME</Text>
          </TouchableOpacity>
        </View>

        {/* Run Stats */}
        <View style={styles.runStatsSection}>
          <View style={styles.runStatsGrid}>
            <View style={styles.runStatItem}>
              <Text style={styles.runStatValue}>{Math.floor(distance)}</Text>
              <Text style={styles.runStatLabel}>Distance</Text>
            </View>
            <View style={styles.runStatItem}>
              <Text style={styles.runStatValue}>{masteryStats.maxRhythmStreak}</Text>
              <Text style={styles.runStatLabel}>Best Streak</Text>
            </View>
            <View style={styles.runStatItem}>
              <Text style={styles.runStatValue}>{masteryStats.phaseThroughs}</Text>
              <Text style={styles.runStatLabel}>Phases</Text>
            </View>
            <View style={styles.runStatItem}>
              <Text style={styles.runStatValue}>{Math.floor(masteryStats.lowHpSurvivalTime)}s</Text>
              <Text style={styles.runStatLabel}>Low HP</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Unlock Modal */}
      <Modal visible={showUnlockModal} transparent animationType="fade">
        <View style={styles.unlockOverlay}>
          <Animated.View style={[styles.unlockModal, unlockAnimStyle]}>
            <View style={styles.unlockIcon}>
              <Ionicons name="star" size={40} color="#ffaa00" />
            </View>
            <Text style={styles.unlockTitle}>NEW UNLOCK!</Text>
            <Text style={styles.unlockSubtitle}>Mastery rewards earned</Text>
            
            {newUnlocks.map((unlock) => (
              <View key={unlock} style={styles.unlockItem}>
                <Ionicons name="checkmark-circle" size={18} color="#00ff88" />
                <Text style={styles.unlockName}>
                  {unlock.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </Text>
              </View>
            ))}
            
            <TouchableOpacity 
              style={styles.unlockDismiss}
              onPress={() => setShowUnlockModal(false)}
            >
              <Text style={styles.unlockDismissText}>AWESOME!</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
    marginBottom: 16,
    marginTop: 8,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 10,
    color: '#666',
    letterSpacing: 2,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 44,
    fontWeight: '900',
    color: '#00ffff',
  },
  blueprintSection: {
    width: '100%',
    backgroundColor: 'rgba(0,170,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,170,255,0.3)',
  },
  blueprintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  blueprintTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00aaff',
    letterSpacing: 2,
  },
  blueprintTotal: {
    fontSize: 36,
    fontWeight: '900',
    color: '#00aaff',
    textAlign: 'center',
  },
  blueprintBreakdown: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  bpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bpLabel: {
    fontSize: 11,
    color: '#888',
  },
  bpValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  totalBlueprints: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 12,
    minWidth: 70,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  shardIconSmall: {
    width: 8,
    height: 14,
    backgroundColor: '#00ff88',
    borderRadius: 2,
    transform: [{ rotate: '15deg' }],
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  masterySection: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
  },
  masteryTrack: {
    marginBottom: 12,
  },
  masteryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  masteryLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  masteryName: {
    fontSize: 12,
    fontWeight: '600',
  },
  masteryXp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  xpGained: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00ff88',
  },
  masteryLevel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  buildSection: {
    width: '100%',
    marginBottom: 16,
  },
  upgradesList: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 10,
  },
  upgradeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    gap: 8,
  },
  upgradeNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,255,255,0.2)',
    color: '#00ffff',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  upgradeName: {
    fontSize: 12,
    color: '#fff',
    flex: 1,
  },
  upgradeCategory: {
    fontSize: 9,
    color: '#666',
    textTransform: 'uppercase',
  },
  categoriesUsed: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00ffff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 6,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0a0a1a',
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    gap: 6,
  },
  homeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  runStatsSection: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
  },
  runStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  runStatItem: {
    alignItems: 'center',
    width: '45%',
    marginBottom: 8,
  },
  runStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  runStatLabel: {
    fontSize: 9,
    color: '#666',
  },
  unlockOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockModal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: SCREEN_WIDTH - 48,
    maxWidth: 320,
    borderWidth: 2,
    borderColor: '#ffaa00',
  },
  unlockIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,170,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  unlockTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffaa00',
    letterSpacing: 2,
    marginBottom: 6,
  },
  unlockSubtitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 16,
  },
  unlockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    width: '100%',
    marginBottom: 6,
  },
  unlockName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  unlockDismiss: {
    backgroundColor: '#ffaa00',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginTop: 12,
  },
  unlockDismissText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0a0a1a',
  },
});
