// Unlocks Screen - Blueprint Shop

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../game/store';
import { getUnlockableUpgrades, BLUEPRINT_UPGRADES, MASTERY_UPGRADES } from '../game/data/upgrades';
import { COSMETIC_SKINS, HAZARD_THEMES, getMasteryLevel } from '../game/mastery';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'upgrades' | 'skins' | 'themes';

interface UnlocksScreenProps {
  onBack: () => void;
}

export function UnlocksScreen({ onBack }: UnlocksScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>('upgrades');
  const { 
    persistentMastery, 
    purchaseUpgrade, 
    purchaseCosmetic, 
    purchaseTheme,
    selectSkin,
    selectTheme,
  } = useGameStore();

  const handlePurchaseUpgrade = async (id: string, cost: number) => {
    if (persistentMastery.blueprints < cost) {
      Alert.alert('Not Enough Blueprints', `You need ${cost} blueprints to unlock this.`);
      return;
    }
    const success = await purchaseUpgrade(id, cost);
    if (success) {
      Alert.alert('Unlocked!', 'New upgrade available in your runs.');
    }
  };

  const handlePurchaseSkin = async (id: string, cost: number) => {
    if (cost === 0) {
      await selectSkin(id);
      return;
    }
    if (persistentMastery.blueprints < cost) {
      Alert.alert('Not Enough Blueprints', `You need ${cost} blueprints to unlock this.`);
      return;
    }
    const success = await purchaseCosmetic(id, cost);
    if (success) {
      await selectSkin(id);
      Alert.alert('Unlocked!', 'New skin equipped.');
    }
  };

  const handlePurchaseTheme = async (id: string, cost: number) => {
    if (cost === 0) {
      await selectTheme(id);
      return;
    }
    if (persistentMastery.blueprints < cost) {
      Alert.alert('Not Enough Blueprints', `You need ${cost} blueprints to unlock this.`);
      return;
    }
    const success = await purchaseTheme(id, cost);
    if (success) {
      await selectTheme(id);
      Alert.alert('Unlocked!', 'New theme equipped.');
    }
  };

  const rarityColors = {
    common: '#888888',
    uncommon: '#00ff88',
    rare: '#00aaff',
    legendary: '#ffaa00',
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>UNLOCKS</Text>
        <View style={styles.blueprintCount}>
          <Ionicons name="cube" size={18} color="#00aaff" />
          <Text style={styles.blueprintText}>{persistentMastery.blueprints}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upgrades' && styles.tabActive]}
          onPress={() => setActiveTab('upgrades')}
        >
          <Ionicons name="flash" size={18} color={activeTab === 'upgrades' ? '#00ffff' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'upgrades' && styles.tabTextActive]}>Upgrades</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'skins' && styles.tabActive]}
          onPress={() => setActiveTab('skins')}
        >
          <Ionicons name="color-palette" size={18} color={activeTab === 'skins' ? '#00ffff' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'skins' && styles.tabTextActive]}>Skins</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'themes' && styles.tabActive]}
          onPress={() => setActiveTab('themes')}
        >
          <Ionicons name="planet" size={18} color={activeTab === 'themes' ? '#00ffff' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'themes' && styles.tabTextActive]}>Themes</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Upgrades Tab */}
        {activeTab === 'upgrades' && (
          <View>
            <Text style={styles.sectionHeader}>BLUEPRINT UPGRADES</Text>
            <Text style={styles.sectionDesc}>Purchase with blueprints</Text>
            {BLUEPRINT_UPGRADES.map((upgrade) => {
              const isUnlocked = persistentMastery.unlockedUpgrades.includes(upgrade.id);
              const canAfford = persistentMastery.blueprints >= (upgrade.blueprintCost || 0);
              
              return (
                <View key={upgrade.id} style={[styles.upgradeCard, isUnlocked && styles.cardUnlocked]}>
                  <View style={[styles.rarityBadge, { backgroundColor: rarityColors[upgrade.rarity] }]} />
                  <View style={styles.upgradeInfo}>
                    <Text style={styles.upgradeName}>{upgrade.name}</Text>
                    <Text style={styles.upgradeDesc}>{upgrade.description}</Text>
                    <View style={styles.upgradeFooter}>
                      <Text style={styles.upgradeCategory}>{upgrade.category.toUpperCase()}</Text>
                      <Text style={[styles.upgradeRarity, { color: rarityColors[upgrade.rarity] }]}>
                        {upgrade.rarity.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.buyButton,
                      isUnlocked && styles.buyButtonUnlocked,
                      !canAfford && !isUnlocked && styles.buyButtonDisabled,
                    ]}
                    onPress={() => !isUnlocked && handlePurchaseUpgrade(upgrade.id, upgrade.blueprintCost || 0)}
                    disabled={isUnlocked}
                  >
                    {isUnlocked ? (
                      <Ionicons name="checkmark" size={18} color="#00ff88" />
                    ) : (
                      <>
                        <Ionicons name="cube" size={14} color={canAfford ? '#0a0a1a' : '#666'} />
                        <Text style={[styles.buyText, !canAfford && styles.buyTextDisabled]}>
                          {upgrade.blueprintCost}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}

            <Text style={[styles.sectionHeader, { marginTop: 24 }]}>MASTERY UPGRADES</Text>
            <Text style={styles.sectionDesc}>Unlock by reaching mastery levels</Text>
            {MASTERY_UPGRADES.map((upgrade) => {
              const isUnlocked = persistentMastery.unlockedUpgrades.includes(upgrade.id);
              const req = upgrade.requiresMastery;
              const currentLevel = req ? getMasteryLevel(persistentMastery.progress[req.track]) : 0;
              const meetsRequirement = req ? currentLevel >= req.level : false;
              
              return (
                <View key={upgrade.id} style={[styles.upgradeCard, isUnlocked && styles.cardUnlocked]}>
                  <View style={[styles.rarityBadge, { backgroundColor: rarityColors[upgrade.rarity] }]} />
                  <View style={styles.upgradeInfo}>
                    <Text style={styles.upgradeName}>{upgrade.name}</Text>
                    <Text style={styles.upgradeDesc}>{upgrade.description}</Text>
                    <View style={styles.upgradeFooter}>
                      <Text style={styles.upgradeCategory}>{upgrade.category.toUpperCase()}</Text>
                      {req && (
                        <Text style={[
                          styles.masteryReq,
                          meetsRequirement ? styles.masteryReqMet : styles.masteryReqUnmet
                        ]}>
                          {req.track.charAt(0).toUpperCase() + req.track.slice(1)} Lv.{req.level}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={[styles.statusBadge, isUnlocked && styles.statusUnlocked]}>
                    {isUnlocked ? (
                      <Ionicons name="checkmark" size={16} color="#00ff88" />
                    ) : meetsRequirement ? (
                      <Ionicons name="lock-open" size={16} color="#ffaa00" />
                    ) : (
                      <Ionicons name="lock-closed" size={16} color="#666" />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Skins Tab */}
        {activeTab === 'skins' && (
          <View>
            <Text style={styles.sectionHeader}>PLAYER SKINS</Text>
            <Text style={styles.sectionDesc}>Cosmetic only - no gameplay advantage</Text>
            <View style={styles.skinsGrid}>
              {COSMETIC_SKINS.map((skin) => {
                const isUnlocked = persistentMastery.unlockedCosmetics.includes(skin.id);
                const isSelected = persistentMastery.selectedSkin === skin.id;
                const canAfford = persistentMastery.blueprints >= skin.blueprintCost;
                
                return (
                  <TouchableOpacity
                    key={skin.id}
                    style={[
                      styles.skinCard,
                      isSelected && styles.skinCardSelected,
                    ]}
                    onPress={() => isUnlocked ? selectSkin(skin.id) : handlePurchaseSkin(skin.id, skin.blueprintCost)}
                  >
                    <View style={[styles.skinPreview, { backgroundColor: skin.coreColor }]}>
                      <View style={[styles.skinGlow, { backgroundColor: skin.glowColor }]} />
                    </View>
                    <Text style={styles.skinName}>{skin.name}</Text>
                    <Text style={styles.skinDesc}>{skin.description}</Text>
                    {isSelected ? (
                      <View style={styles.equippedBadge}>
                        <Text style={styles.equippedText}>EQUIPPED</Text>
                      </View>
                    ) : isUnlocked ? (
                      <TouchableOpacity style={styles.equipButton} onPress={() => selectSkin(skin.id)}>
                        <Text style={styles.equipText}>EQUIP</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.skinPrice, !canAfford && styles.skinPriceDisabled]}>
                        <Ionicons name="cube" size={12} color={canAfford ? '#00aaff' : '#666'} />
                        <Text style={[styles.skinPriceText, !canAfford && styles.skinPriceTextDisabled]}>
                          {skin.blueprintCost || 'FREE'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Themes Tab */}
        {activeTab === 'themes' && (
          <View>
            <Text style={styles.sectionHeader}>HAZARD THEMES</Text>
            <Text style={styles.sectionDesc}>Visual variety - same difficulty</Text>
            {HAZARD_THEMES.map((theme) => {
              const isUnlocked = persistentMastery.unlockedThemes.includes(theme.id);
              const isSelected = persistentMastery.selectedTheme === theme.id;
              const canAfford = persistentMastery.blueprints >= theme.blueprintCost;
              
              return (
                <View key={theme.id} style={[styles.themeCard, isSelected && styles.themeCardSelected]}>
                  <View style={styles.themePreview}>
                    <View style={[styles.themeColor, { backgroundColor: theme.wallColor }]} />
                    <View style={[styles.themeColor, { backgroundColor: theme.droneColor }]} />
                    <View style={[styles.themeColor, { backgroundColor: theme.laserColor }]} />
                  </View>
                  <View style={styles.themeInfo}>
                    <Text style={styles.themeName}>{theme.name}</Text>
                    <Text style={styles.themeDesc}>{theme.description}</Text>
                  </View>
                  {isSelected ? (
                    <View style={styles.equippedBadgeSmall}>
                      <Text style={styles.equippedTextSmall}>ACTIVE</Text>
                    </View>
                  ) : isUnlocked ? (
                    <TouchableOpacity style={styles.equipButtonSmall} onPress={() => selectTheme(theme.id)}>
                      <Text style={styles.equipTextSmall}>USE</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.buyButtonSmall, !canAfford && styles.buyButtonDisabled]}
                      onPress={() => handlePurchaseTheme(theme.id, theme.blueprintCost)}
                      disabled={!canAfford}
                    >
                      <Ionicons name="cube" size={12} color={canAfford ? '#0a0a1a' : '#666'} />
                      <Text style={[styles.buyTextSmall, !canAfford && styles.buyTextDisabled]}>
                        {theme.blueprintCost}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 3,
  },
  blueprintCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,170,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  blueprintText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00aaff',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(0,255,255,0.15)',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#00ffff',
  },
  content: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 2,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 11,
    color: '#555',
    marginBottom: 12,
  },
  upgradeCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  cardUnlocked: {
    backgroundColor: 'rgba(0,255,136,0.1)',
  },
  rarityBadge: {
    width: 4,
  },
  upgradeInfo: {
    flex: 1,
    padding: 12,
  },
  upgradeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  upgradeDesc: {
    fontSize: 11,
    color: '#888',
    marginBottom: 6,
  },
  upgradeFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  upgradeCategory: {
    fontSize: 9,
    fontWeight: '600',
    color: '#666',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  upgradeRarity: {
    fontSize: 9,
    fontWeight: '600',
  },
  masteryReq: {
    fontSize: 9,
    fontWeight: '600',
  },
  masteryReqMet: {
    color: '#00ff88',
  },
  masteryReqUnmet: {
    color: '#ff6666',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00aaff',
    paddingHorizontal: 12,
    gap: 4,
    minWidth: 60,
  },
  buyButtonUnlocked: {
    backgroundColor: 'rgba(0,255,136,0.2)',
  },
  buyButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  buyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0a0a1a',
  },
  buyTextDisabled: {
    color: '#666',
  },
  statusBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  statusUnlocked: {
    backgroundColor: 'rgba(0,255,136,0.1)',
  },
  skinsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  skinCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  skinCardSelected: {
    borderWidth: 2,
    borderColor: '#00ffff',
  },
  skinPreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  skinGlow: {
    width: 60,
    height: 60,
    borderRadius: 30,
    position: 'absolute',
    opacity: 0.3,
  },
  skinName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  skinDesc: {
    fontSize: 10,
    color: '#888',
    marginBottom: 8,
    textAlign: 'center',
  },
  equippedBadge: {
    backgroundColor: 'rgba(0,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  equippedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00ffff',
  },
  equipButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  equipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  skinPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,170,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  skinPriceDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skinPriceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00aaff',
  },
  skinPriceTextDisabled: {
    color: '#666',
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  themeCardSelected: {
    borderWidth: 2,
    borderColor: '#00ffff',
  },
  themePreview: {
    flexDirection: 'row',
    gap: 4,
    marginRight: 12,
  },
  themeColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  themeDesc: {
    fontSize: 11,
    color: '#888',
  },
  equippedBadgeSmall: {
    backgroundColor: 'rgba(0,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  equippedTextSmall: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00ffff',
  },
  equipButtonSmall: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  equipTextSmall: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  buyButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00aaff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  buyTextSmall: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0a0a1a',
  },
});
