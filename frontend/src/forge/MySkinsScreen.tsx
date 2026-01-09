// My Skins Screen - View and manage forged skins

import React, { useEffect, useState, useCallback } from 'react';
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
import { SkinPreview } from './SkinPreview';
import {
  SkinRecipe,
  loadForgedSkins,
  deleteForgedSkin,
  setEquippedSkin,
  getEquippedSkin,
} from './skinForge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MySkinsScreenProps {
  onBack: () => void;
  onForgeNew: () => void;
  onSkinEquipped?: () => void;
}

export function MySkinsScreen({ onBack, onForgeNew, onSkinEquipped }: MySkinsScreenProps) {
  const [skins, setSkins] = useState<SkinRecipe[]>([]);
  const [equippedId, setEquippedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [loadedSkins, equipped] = await Promise.all([
      loadForgedSkins(),
      getEquippedSkin(),
    ]);
    setSkins(loadedSkins);
    setEquippedId(equipped);
    setLoading(false);
  };

  const handleEquip = useCallback(async (skinId: string) => {
    await setEquippedSkin(skinId);
    setEquippedId(skinId);
    onSkinEquipped?.();
  }, [onSkinEquipped]);

  const handleUnequip = useCallback(async () => {
    await setEquippedSkin(null);
    setEquippedId(null);
    onSkinEquipped?.();
  }, [onSkinEquipped]);

  const handleDelete = useCallback(async (skin: SkinRecipe) => {
    Alert.alert(
      'Delete Skin',
      `Are you sure you want to delete this skin? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (equippedId === skin.id) {
              await setEquippedSkin(null);
              setEquippedId(null);
            }
            await deleteForgedSkin(skin.id);
            setSkins(prev => prev.filter(s => s.id !== skin.id));
          },
        },
      ]
    );
  }, [equippedId]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>MY SKINS</Text>
        <TouchableOpacity onPress={onForgeNew} style={styles.forgeButton}>
          <Ionicons name="add" size={24} color="#ffaa00" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Currently Equipped */}
        {equippedId && (
          <View style={styles.equippedSection}>
            <Text style={styles.sectionTitle}>CURRENTLY EQUIPPED</Text>
            {skins.filter(s => s.id === equippedId).map(skin => (
              <View key={skin.id} style={styles.equippedCard}>
                <SkinPreview recipe={skin} size={100} animated={true} />
                <View style={styles.equippedInfo}>
                  <Text style={styles.skinPrompt} numberOfLines={2}>
                    "{skin.prompt}"
                  </Text>
                  <View style={styles.skinMeta}>
                    <Text style={styles.skinShape}>{skin.baseShape}</Text>
                    <Text style={styles.skinDot}>•</Text>
                    <Text style={styles.skinAura}>{skin.auraType}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.unequipButton}
                    onPress={handleUnequip}
                  >
                    <Text style={styles.unequipText}>Use Default</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* All Skins */}
        <View style={styles.allSkinsSection}>
          <Text style={styles.sectionTitle}>
            {skins.length > 0 ? `ALL FORGED SKINS (${skins.length})` : 'NO SKINS YET'}
          </Text>

          {skins.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="color-wand-outline" size={48} color="#444" />
              <Text style={styles.emptyText}>You haven't forged any skins yet.</Text>
              <TouchableOpacity style={styles.createButton} onPress={onForgeNew}>
                <Ionicons name="sparkles" size={18} color="#0a0a1a" />
                <Text style={styles.createText}>FORGE YOUR FIRST SKIN</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.skinsGrid}>
              {skins.map(skin => (
                <View key={skin.id} style={styles.skinCard}>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(skin)}
                  >
                    <Ionicons name="close" size={16} color="#ff4444" />
                  </TouchableOpacity>

                  <SkinPreview recipe={skin} size={70} animated={false} />
                  
                  <Text style={styles.skinPromptSmall} numberOfLines={1}>
                    {skin.prompt}
                  </Text>
                  
                  <Text style={styles.skinDate}>{formatDate(skin.createdAt)}</Text>

                  {equippedId === skin.id ? (
                    <View style={styles.equippedBadge}>
                      <Text style={styles.equippedText}>EQUIPPED</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.equipButton}
                      onPress={() => handleEquip(skin.id)}
                    >
                      <Text style={styles.equipText}>EQUIP</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Forge New Button */}
        {skins.length > 0 && (
          <TouchableOpacity style={styles.forgeNewButton} onPress={onForgeNew}>
            <Ionicons name="color-wand" size={20} color="#0a0a1a" />
            <Text style={styles.forgeNewText}>FORGE NEW SKIN</Text>
          </TouchableOpacity>
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
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  forgeButton: {
    padding: 8,
  },
  content: {
    padding: 16,
  },
  equippedSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 2,
    marginBottom: 12,
  },
  equippedCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,255,136,0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.3)',
  },
  equippedInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  skinPrompt: {
    fontSize: 14,
    color: '#fff',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  skinMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skinShape: {
    fontSize: 12,
    color: '#888',
    textTransform: 'capitalize',
  },
  skinDot: {
    fontSize: 12,
    color: '#444',
    marginHorizontal: 6,
  },
  skinAura: {
    fontSize: 12,
    color: '#888',
    textTransform: 'capitalize',
  },
  unequipButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  unequipText: {
    fontSize: 11,
    color: '#888',
  },
  allSkinsSection: {
    marginBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    marginBottom: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffaa00',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  createText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0a0a1a',
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
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,68,68,0.2)',
    borderRadius: 12,
    padding: 4,
    zIndex: 1,
  },
  skinPromptSmall: {
    fontSize: 11,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  skinDate: {
    fontSize: 10,
    color: '#555',
    marginTop: 4,
  },
  equippedBadge: {
    backgroundColor: 'rgba(0,255,136,0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  equippedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00ff88',
  },
  equipButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  equipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  forgeNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffaa00',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  forgeNewText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0a0a1a',
  },
});
