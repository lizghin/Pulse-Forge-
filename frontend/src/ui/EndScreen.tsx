// End Screen - Run summary

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../game/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EndScreenProps {
  onRetry: () => void;
  onHome: () => void;
}

export function EndScreen({ onRetry, onHome }: EndScreenProps) {
  const { score, shards, perfectPulses, distance, selectedUpgrades } = useGameStore();

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
            <View style={[styles.statIcon, { backgroundColor: 'rgba(0,255,255,0.2)' }]}>
              <Ionicons name="navigate" size={24} color="#00ffff" />
            </View>
            <Text style={styles.statValue}>{Math.floor(distance)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
        </View>

        {/* Build Recap */}
        {selectedUpgrades.length > 0 && (
          <View style={styles.buildSection}>
            <Text style={styles.buildTitle}>BUILD RECAP</Text>
            <View style={styles.upgradesList}>
              {selectedUpgrades.map((upgrade, index) => (
                <View key={upgrade.id} style={styles.upgradeItem}>
                  <Text style={styles.upgradeNumber}>{index + 1}</Text>
                  <Text style={styles.upgradeName}>{upgrade.name}</Text>
                </View>
              ))}
            </View>
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

        {/* Challenge progress placeholder */}
        <View style={styles.challengeSection}>
          <Text style={styles.challengeTitle}>MASTERY CHALLENGE</Text>
          <View style={styles.challengeItem}>
            <Text style={styles.challengeName}>Collect 100 shards in one run</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, (shards / 100) * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{shards}/100</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
    marginBottom: 32,
    marginTop: 20,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
    letterSpacing: 2,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: '900',
    color: '#00ffff',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 32,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 16,
    minWidth: 90,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shardIconSmall: {
    width: 10,
    height: 16,
    backgroundColor: '#00ff88',
    borderRadius: 2,
    transform: [{ rotate: '15deg' }],
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  buildSection: {
    width: '100%',
    marginBottom: 32,
  },
  buildTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
  },
  upgradesList: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
  },
  upgradeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  upgradeNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,255,255,0.2)',
    color: '#00ffff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
  },
  upgradeName: {
    fontSize: 14,
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00ffff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
  },
  retryText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0a0a1a',
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  homeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  challengeSection: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
  },
  challengeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: 'center',
  },
  challengeItem: {
    alignItems: 'center',
  },
  challengeName: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffaa00',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#888',
  },
});
