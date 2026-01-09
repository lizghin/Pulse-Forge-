// End Screen - Run summary with Mastery Progress

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
  } = useGameStore();
  
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  
  // Calculate XP gained this run
  const xpGained = calculateRunMasteryXP(masteryStats);
  
  // Animation values
  const timingProgress = useSharedValue(0);
  const riskProgress = useSharedValue(0);
  const buildProgress = useSharedValue(0);
  const unlockScale = useSharedValue(0);
  
  useEffect(() => {
    // Animate progress bars
    const timingTarget = getMasteryProgressToNext(persistentMastery.progress.timing);
    const riskTarget = getMasteryProgressToNext(persistentMastery.progress.risk);
    const buildTarget = getMasteryProgressToNext(persistentMastery.progress.build);
    
    timingProgress.value = withDelay(300, withTiming(timingTarget, { duration: 800 }));
    riskProgress.value = withDelay(500, withTiming(riskTarget, { duration: 800 }));
    buildProgress.value = withDelay(700, withTiming(buildTarget, { duration: 800 }));
    
    // Show unlock modal if new unlocks
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
        {/* Title */}
        <Text style={styles.title}>RUN COMPLETE</Text>

        {/* Score */}
        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>CORE SCORE</Text>
          <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
        </View>

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
              <Ionicons name="flash" size={24} color="#ffaa00" />
            </View>
            <Text style={styles.statValue}>{perfectPulses}</Text>
            <Text style={styles.statLabel}>Perfect</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(255,68,68,0.2)' }]}>
              <Ionicons name="flame" size={24} color="#ff4444" />
            </View>
            <Text style={styles.statValue}>{masteryStats.nearMisses}</Text>
            <Text style={styles.statLabel}>Near Miss</Text>
          </View>
        </View>

        {/* Mastery Progress Section */}
        <View style={styles.masterySection}>
          <Text style={styles.sectionTitle}>MASTERY PROGRESS</Text>
          
          {/* Timing Mastery */}
          <View style={styles.masteryTrack}>
            <View style={styles.masteryHeader}>
              <View style={styles.masteryLabel}>
                <Ionicons name="flash" size={18} color={MASTERY_TRACKS.timing.color} />
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
            <Text style={styles.masteryDesc}>{MASTERY_TRACKS.timing.description}</Text>
          </View>
          
          {/* Risk Mastery */}
          <View style={styles.masteryTrack}>
            <View style={styles.masteryHeader}>
              <View style={styles.masteryLabel}>
                <Ionicons name="flame" size={18} color={MASTERY_TRACKS.risk.color} />
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
            <Text style={styles.masteryDesc}>{MASTERY_TRACKS.risk.description}</Text>
          </View>
          
          {/* Build Mastery */}
          <View style={styles.masteryTrack}>
            <View style={styles.masteryHeader}>
              <View style={styles.masteryLabel}>
                <Ionicons name="construct" size={18} color={MASTERY_TRACKS.build.color} />
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
            <Text style={styles.masteryDesc}>{MASTERY_TRACKS.build.description}</Text>
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
              {masteryStats.categoriesUsed.size}/5 categories used
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={24} color="#0a0a1a" />
            <Text style={styles.retryText}>RETRY</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeButton}
            onPress={onHome}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={24} color="#888" />
            <Text style={styles.homeText}>HOME</Text>
          </TouchableOpacity>
        </View>

        {/* Run Stats */}
        <View style={styles.runStatsSection}>
          <Text style={styles.runStatsTitle}>RUN STATISTICS</Text>
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
              <Text style={styles.runStatLabel}>Phase Throughs</Text>
            </View>
            <View style={styles.runStatItem}>
              <Text style={styles.runStatValue}>{Math.floor(masteryStats.lowHpSurvivalTime)}s</Text>
              <Text style={styles.runStatLabel}>Low HP Time</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Unlock Modal */}
      <Modal visible={showUnlockModal} transparent animationType="fade">
        <View style={styles.unlockOverlay}>
          <Animated.View style={[styles.unlockModal, unlockAnimStyle]}>
            <View style={styles.unlockIcon}>
              <Ionicons name="star" size={48} color="#ffaa00" />
            </View>
            <Text style={styles.unlockTitle}>NEW UNLOCK!</Text>
            <Text style={styles.unlockSubtitle}>Mastery rewards earned</Text>
            
            {newUnlocks.map((unlock) => (
              <View key={unlock} style={styles.unlockItem}>
                <Ionicons name="checkmark-circle" size={20} color="#00ff88" />
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
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
    marginBottom: 20,
    marginTop: 10,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreLabel: {
    fontSize: 11,
    color: '#666',
    letterSpacing: 2,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#00ffff',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 12,
    minWidth: 80,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  shardIconSmall: {
    width: 10,
    height: 16,
    backgroundColor: '#00ff88',
    borderRadius: 2,
    transform: [{ rotate: '15deg' }],
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  masterySection: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: 'center',
  },
  masteryTrack: {
    marginBottom: 16,
  },
  masteryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  masteryLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  masteryName: {
    fontSize: 14,
    fontWeight: '600',
  },
  masteryXp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpGained: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00ff88',
  },
  masteryLevel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  masteryDesc: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  buildSection: {
    width: '100%',
    marginBottom: 20,
  },
  upgradesList: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
  },
  upgradeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  upgradeNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,255,255,0.2)',
    color: '#00ffff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
  upgradeName: {
    fontSize: 13,
    color: '#fff',
    flex: 1,
  },
  upgradeCategory: {
    fontSize: 10,
    color: '#666',
    textTransform: 'uppercase',
  },
  categoriesUsed: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00ffff',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    gap: 8,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a0a1a',
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 8,
  },
  homeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  runStatsSection: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
  },
  runStatsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
  },
  runStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  runStatItem: {
    alignItems: 'center',
    width: '45%',
    marginBottom: 12,
  },
  runStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  runStatLabel: {
    fontSize: 10,
    color: '#666',
  },
  // Unlock Modal
  unlockOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockModal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: SCREEN_WIDTH - 48,
    maxWidth: 340,
    borderWidth: 2,
    borderColor: '#ffaa00',
  },
  unlockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,170,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  unlockTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffaa00',
    letterSpacing: 2,
    marginBottom: 8,
  },
  unlockSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  unlockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 8,
  },
  unlockName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  unlockDismiss: {
    backgroundColor: '#ffaa00',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginTop: 16,
  },
  unlockDismissText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a0a1a',
  },
});
