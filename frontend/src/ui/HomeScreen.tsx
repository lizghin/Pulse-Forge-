// Home Screen

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HomeScreenProps {
  onPlay: () => void;
  onSettings: () => void;
}

export function HomeScreen({ onPlay, onSettings }: HomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Background */}
      <View style={styles.background}>
        {/* Decorative circles */}
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

        {/* Play Button */}
        <TouchableOpacity style={styles.playButton} onPress={onPlay} activeOpacity={0.8}>
          <View style={styles.playButtonInner}>
            <Ionicons name="play" size={32} color="#0a0a1a" />
            <Text style={styles.playButtonText}>PLAY 90s RUN</Text>
          </View>
        </TouchableOpacity>

        {/* Secondary Buttons */}
        <View style={styles.secondaryButtons}>
          <TouchableOpacity style={styles.secondaryButton}>
            <Ionicons name="grid" size={24} color="#00ffff" />
            <Text style={styles.secondaryButtonText}>Upgrades</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton}>
            <Ionicons name="trophy" size={24} color="#ffaa00" />
            <Text style={styles.secondaryButtonText}>Challenges</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onSettings}>
            <Ionicons name="settings" size={24} color="#888" />
            <Text style={styles.secondaryButtonText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* High Score */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>HIGH SCORE</Text>
            <Text style={styles.statValue}>0</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>RUNS</Text>
            <Text style={styles.statValue}>0</Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>HOW TO PLAY</Text>
          <Text style={styles.instructionText}>
            <Text style={styles.highlight}>HOLD</Text> to charge your pulse
          </Text>
          <Text style={styles.instructionText}>
            <Text style={styles.highlight}>RELEASE</Text> to dash forward & phase through obstacles
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
    marginBottom: 8,
  },
  title: {
    fontSize: 56,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 8,
  },
  titleAccent: {
    fontSize: 48,
    fontWeight: '300',
    color: '#00ffff',
    letterSpacing: 12,
    marginTop: -8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    letterSpacing: 2,
    marginBottom: 40,
  },
  playButton: {
    width: SCREEN_WIDTH * 0.75,
    maxWidth: 300,
    marginBottom: 32,
  },
  playButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00ffff',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 12,
  },
  playButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0a0a1a',
    letterSpacing: 2,
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  secondaryButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    minWidth: 80,
  },
  secondaryButtonText: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  instructions: {
    alignItems: 'center',
    padding: 16,
  },
  instructionTitle: {
    fontSize: 12,
    color: '#666',
    letterSpacing: 2,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  highlight: {
    color: '#00ffff',
    fontWeight: '700',
  },
});
