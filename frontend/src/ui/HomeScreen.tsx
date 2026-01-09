// Home Screen with Blueprints Display

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../game/store';
import { getMasteryLevel, MASTERY_TRACKS } from '../game/mastery';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HomeScreenProps {
  onPlay: () => void;
  onSettings: () => void;
  onUnlocks: () => void;
  onForge?: () => void;
  onMySkins?: () => void;
}

export function HomeScreen({ onPlay, onSettings, onUnlocks, onForge, onMySkins }: HomeScreenProps) {
  const { persistentMastery, loadMastery } = useGameStore();
  
  useEffect(() => {
    loadMastery();
  }, []);
  
  const timingLevel = getMasteryLevel(persistentMastery.progress.timing);
  const riskLevel = getMasteryLevel(persistentMastery.progress.risk);
  const buildLevel = getMasteryLevel(persistentMastery.progress.build);
  const totalLevel = timingLevel + riskLevel + buildLevel;

  return (
    <SafeAreaView style={styles.container}>
      {/* Background */}
      <View style={styles.background}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>PULSE</Text>
          <Text style={styles.titleAccent}>FORGE</Text>
        </View>

        <Text style={styles.subtitle}>90-Second Micro-Roguelike</Text>

        {/* Blueprint Counter */}
        <View style={styles.blueprintCounter}>
          <Ionicons name="cube" size={20} color="#00aaff" />
          <Text style={styles.blueprintValue}>{persistentMastery.blueprints}</Text>
          <Text style={styles.blueprintLabel}>Blueprints</Text>
        </View>

        {/* Mastery Summary */}
        <View style={styles.masterySummary}>
          <View style={styles.masteryItem}>
            <Ionicons name="flash" size={14} color={MASTERY_TRACKS.timing.color} />
            <Text style={[styles.masteryLevel, { color: MASTERY_TRACKS.timing.color }]}>
              {timingLevel}
            </Text>
          </View>
          <View style={styles.masteryItem}>
            <Ionicons name="flame" size={14} color={MASTERY_TRACKS.risk.color} />
            <Text style={[styles.masteryLevel, { color: MASTERY_TRACKS.risk.color }]}>
              {riskLevel}
            </Text>
          </View>
          <View style={styles.masteryItem}>
            <Ionicons name="construct" size={14} color={MASTERY_TRACKS.build.color} />
            <Text style={[styles.masteryLevel, { color: MASTERY_TRACKS.build.color }]}>
              {buildLevel}
            </Text>
          </View>
        </View>

        {/* Play Button */}
        <TouchableOpacity style={styles.playButton} onPress={onPlay} activeOpacity={0.8}>
          <View style={styles.playButtonInner}>
            <Ionicons name="play" size={26} color="#0a0a1a" />
            <Text style={styles.playButtonText}>PLAY 90s RUN</Text>
          </View>
        </TouchableOpacity>

        {/* Secondary Buttons */}
        <View style={styles.secondaryButtons}>
          <TouchableOpacity style={styles.secondaryButton} onPress={onUnlocks}>
            <Ionicons name="grid" size={20} color="#00ffff" />
            <Text style={styles.secondaryButtonText}>Unlocks</Text>
            <Text style={styles.unlockCount}>
              {persistentMastery.unlockedUpgrades.length + 12}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton}>
            <Ionicons name="trophy" size={20} color="#ffaa00" />
            <Text style={styles.secondaryButtonText}>Mastery</Text>
            <Text style={styles.unlockCount}>Lv.{totalLevel}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onSettings}>
            <Ionicons name="settings" size={20} color="#888" />
            <Text style={styles.secondaryButtonText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* High Score */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>HIGH SCORE</Text>
            <Text style={styles.statValue}>
              {persistentMastery.highScore.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>RUNS</Text>
            <Text style={styles.statValue}>{persistentMastery.totalRuns}</Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>HOW TO PLAY</Text>
          <Text style={styles.instructionText}>
            <Text style={styles.highlight}>HOLD</Text> to charge pulse
          </Text>
          <Text style={styles.instructionText}>
            <Text style={styles.highlight}>RELEASE</Text> to dash & phase
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.1,
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: '#00ffff',
    top: -100,
    right: -50,
  },
  circle2: {
    width: 200,
    height: 200,
    backgroundColor: '#ff00ff',
    bottom: 100,
    left: -50,
  },
  circle3: {
    width: 150,
    height: 150,
    backgroundColor: '#00ff88',
    bottom: -50,
    right: 50,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 8,
  },
  titleAccent: {
    fontSize: 40,
    fontWeight: '300',
    color: '#00ffff',
    letterSpacing: 12,
    marginTop: -8,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    letterSpacing: 2,
    marginBottom: 16,
  },
  blueprintCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,170,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  blueprintValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00aaff',
  },
  blueprintLabel: {
    fontSize: 12,
    color: '#00aaff',
    opacity: 0.8,
  },
  masterySummary: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  masteryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 5,
  },
  masteryLevel: {
    fontSize: 13,
    fontWeight: '700',
  },
  playButton: {
    width: SCREEN_WIDTH * 0.72,
    maxWidth: 270,
    marginBottom: 20,
  },
  playButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00ffff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a0a1a',
    letterSpacing: 2,
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  secondaryButton: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    minWidth: 72,
  },
  secondaryButtonText: {
    fontSize: 10,
    color: '#888',
    marginTop: 5,
  },
  unlockCount: {
    fontSize: 9,
    color: '#00ffff',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  statLabel: {
    fontSize: 8,
    color: '#666',
    letterSpacing: 1,
    marginBottom: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  instructions: {
    alignItems: 'center',
    padding: 10,
  },
  instructionTitle: {
    fontSize: 10,
    color: '#666',
    letterSpacing: 2,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  highlight: {
    color: '#00ffff',
    fontWeight: '700',
  },
});
