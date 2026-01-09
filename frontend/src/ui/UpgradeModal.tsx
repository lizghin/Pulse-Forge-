// Upgrade Modal - Roguelike choice overlay

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../game/store';
import { Upgrade } from '../game/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface UpgradeModalProps {
  visible: boolean;
  onSelect: (upgrade: Upgrade) => void;
}

export function UpgradeModal({ visible, onSelect }: UpgradeModalProps) {
  const { upgradeChoices } = useGameStore();

  const rarityColors = {
    common: '#888888',
    uncommon: '#00ff88',
    rare: '#00aaff',
    legendary: '#ffaa00',
  };

  const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    pulse: 'radio-outline',
    movement: 'speedometer-outline',
    defense: 'shield-outline',
    economy: 'diamond-outline',
    synergy: 'git-network-outline',
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>CHOOSE UPGRADE</Text>
          <Text style={styles.subtitle}>Select one to continue</Text>

          <View style={styles.cardsContainer}>
            {upgradeChoices.map((upgrade) => (
              <TouchableOpacity
                key={upgrade.id}
                style={[
                  styles.card,
                  { borderColor: rarityColors[upgrade.rarity] },
                ]}
                onPress={() => onSelect(upgrade)}
                activeOpacity={0.8}
              >
                {/* Rarity indicator */}
                <View
                  style={[
                    styles.rarityBar,
                    { backgroundColor: rarityColors[upgrade.rarity] },
                  ]}
                />

                {/* Icon */}
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${rarityColors[upgrade.rarity]}20` },
                  ]}
                >
                  <Ionicons
                    name={categoryIcons[upgrade.category] || 'star-outline'}
                    size={28}
                    color={rarityColors[upgrade.rarity]}
                  />
                </View>

                {/* Name */}
                <Text style={styles.cardName}>{upgrade.name}</Text>

                {/* Description */}
                <Text style={styles.cardDescription}>{upgrade.description}</Text>

                {/* Category tag */}
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryText}>
                    {upgrade.category.toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH - 32,
    maxWidth: 400,
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
  },
  cardsContainer: {
    width: '100%',
    gap: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    alignItems: 'center',
    overflow: 'hidden',
  },
  rarityBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 12,
  },
  categoryTag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 1,
  },
});
