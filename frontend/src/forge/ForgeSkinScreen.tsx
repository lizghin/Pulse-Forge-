// Forge Skin Screen - Create custom skins from text prompts

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  SafeAreaView,
  ScrollView,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { SkinPreview } from './SkinPreview';
import {
  SkinRecipe,
  generateSkinVariations,
  isPromptSafe,
  saveForgedSkin,
  setEquippedSkin,
  PROMPT_EXAMPLES,
} from './skinForge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ForgeSkinScreenProps {
  onBack: () => void;
  onSkinCreated: (recipe: SkinRecipe) => void;
}

export function ForgeSkinScreen({ onBack, onSkinCreated }: ForgeSkinScreenProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [variations, setVariations] = useState<SkinRecipe[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Animation values for cards
  const card0Scale = useSharedValue(1);
  const card1Scale = useSharedValue(1);
  const card2Scale = useSharedValue(1);
  
  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  const handleGenerate = useCallback(async () => {
    setError(null);
    
    // Validate prompt
    const validation = isPromptSafe(prompt);
    if (!validation.safe) {
      setError(validation.reason || 'Invalid prompt');
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setIsGenerating(true);
    setVariations([]);
    setSelectedIndex(null);
    
    // Simulate slight delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate 3 variations
    const newVariations = generateSkinVariations(prompt, 3);
    setVariations(newVariations);
    setIsGenerating(false);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
  }, [prompt]);

  const handleSelectSkin = useCallback(async (index: number) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    // Animate card scale
    const scales = [card0Scale, card1Scale, card2Scale];
    scales[index].value = withSequence(
      withSpring(1.1, { damping: 8 }),
      withSpring(1, { damping: 12 })
    );
    setSelectedIndex(index);
  }, [card0Scale, card1Scale, card2Scale]);

  const handleUseSkin = useCallback(async () => {
    if (selectedIndex === null) {
      console.log('[Forge] No skin selected');
      return;
    }
    
    console.log('[Forge] Using skin at index:', selectedIndex);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    const selected = variations[selectedIndex];
    
    try {
      console.log('[Forge] Saving skin:', selected.id);
      await saveForgedSkin(selected);
      console.log('[Forge] Skin saved');
      
      await setEquippedSkin(selected.id);
      console.log('[Forge] Skin equipped');
      
      onSkinCreated(selected);
      console.log('[Forge] onSkinCreated called');
      
      // Navigate back after save
      console.log('[Forge] Navigating back, Platform:', Platform.OS);
      if (Platform.OS === 'web') {
        onBack();
      } else {
        Alert.alert(
          'Skin Forged!',
          'Your custom skin has been created and equipped.',
          [{ text: 'Awesome!', onPress: onBack }]
        );
      }
    } catch (err) {
      console.error('[Forge] Error saving skin:', err);
      setError('Failed to save skin. Please try again.');
    }
  }, [selectedIndex, variations, onBack, onSkinCreated]);

  const handleExamplePress = useCallback((example: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setPrompt(example);
    setError(null);
    setVariations([]);
    setSelectedIndex(null);
  }, []);

  const handleMintNFT = useCallback(() => {
    if (selectedIndex === null) return;
    
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Mint as NFT',
      'NFT minting on testnet coming soon! For now, your skin is saved locally and usable in-game.',
      [{ text: 'Got it!' }]
    );
  }, [selectedIndex]);
  
  // Animated styles for cards
  const card0Style = useAnimatedStyle(() => ({
    transform: [{ scale: card0Scale.value }],
  }));
  const card1Style = useAnimatedStyle(() => ({
    transform: [{ scale: card1Scale.value }],
  }));
  const card2Style = useAnimatedStyle(() => ({
    transform: [{ scale: card2Scale.value }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="color-wand" size={24} color="#ffaa00" />
          <Text style={styles.title}>FORGE YOUR CORE</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Description */}
        <Text style={styles.description}>
          Describe your dream core skin and we'll forge it for you.
          Each prompt generates unique, deterministic designs.
        </Text>

        {/* Prompt Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="e.g., Fiery phoenix with golden sparks"
            placeholderTextColor="#666"
            value={prompt}
            onChangeText={(text) => {
              setPrompt(text);
              setError(null);
            }}
            maxLength={200}
            multiline
          />
          <Text style={styles.charCount}>{prompt.length}/200</Text>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={16} color="#ff4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, (!prompt.trim() || isGenerating) && styles.buttonDisabled]}
          onPress={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color="#0a0a1a" />
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="#0a0a1a" />
              <Text style={styles.generateText}>GENERATE SKINS</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Example Prompts */}
        {variations.length === 0 && (
          <View style={styles.examplesSection}>
            <Text style={styles.examplesTitle}>TRY THESE EXAMPLES</Text>
            <View style={styles.examplesGrid}>
              {PROMPT_EXAMPLES.slice(0, 6).map((example, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.exampleChip}
                  onPress={() => handleExamplePress(example)}
                >
                  <Text style={styles.exampleText} numberOfLines={2}>
                    {example}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Generated Variations */}
        {variations.length > 0 && (
          <View style={styles.variationsSection}>
            <Text style={styles.sectionTitle}>CHOOSE YOUR SKIN</Text>
            <View style={styles.variationsGrid}>
              {variations.map((recipe, index) => {
                const animStyle = index === 0 ? card0Style : index === 1 ? card1Style : card2Style;
                return (
                  <Animated.View key={recipe.id} style={animStyle}>
                    <TouchableOpacity
                      style={[
                        styles.variationCard,
                        selectedIndex === index && styles.variationSelected,
                      ]}
                      onPress={() => handleSelectSkin(index)}
                      activeOpacity={0.8}
                    >
                      <SkinPreview recipe={recipe} size={80} animated={true} />
                      <Text style={styles.variationLabel}>#{index + 1}</Text>
                      <View style={styles.variationInfo}>
                        <Text style={styles.variationShape}>{recipe.baseShape}</Text>
                        <Text style={styles.variationAura}>{recipe.auraType}</Text>
                      </View>
                      {selectedIndex === index && (
                        <View style={styles.selectedBadge}>
                          <Ionicons name="checkmark" size={14} color="#00ff88" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>

            {/* Action Buttons */}
            {selectedIndex !== null && (
              <View style={styles.actionButtons}>
                <Pressable
                  style={styles.useSkinButton}
                  onPress={() => {
                    console.log('[Forge] USE THIS SKIN pressed!');
                    handleUseSkin();
                  }}
                  accessibilityRole="button"
                >
                  <Ionicons name="checkmark-circle" size={20} color="#0a0a1a" />
                  <Text style={styles.useSkinText}>USE THIS SKIN</Text>
                </Pressable>

                <Pressable
                  style={styles.mintButton}
                  onPress={() => {
                    console.log('[Forge] MINT NFT pressed!');
                    handleMintNFT();
                  }}
                  accessibilityRole="button"
                >
                  <Ionicons name="diamond" size={18} color="#ffaa00" />
                  <Text style={styles.mintText}>MINT NFT</Text>
                </Pressable>
              </View>
            )}

            {/* Selected Skin Details */}
            {selectedIndex !== null && (
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>SKIN RECIPE</Text>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Shape</Text>
                    <Text style={styles.detailValue}>{variations[selectedIndex].baseShape}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Aura</Text>
                    <Text style={styles.detailValue}>{variations[selectedIndex].auraType}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Particles</Text>
                    <Text style={styles.detailValue}>{variations[selectedIndex].particleStyle}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Outline</Text>
                    <Text style={styles.detailValue}>{variations[selectedIndex].outlineStyle}</Text>
                  </View>
                </View>
                <View style={styles.colorPalette}>
                  <View style={[styles.colorSwatch, { backgroundColor: variations[selectedIndex].primaryColor }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: variations[selectedIndex].secondaryColor }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: variations[selectedIndex].accentColor }]} />
                </View>
              </View>
            )}
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle" size={16} color="#666" />
          <Text style={styles.infoText}>
            Skins are cosmetic only. No gameplay advantage. Same prompt always generates the same skins.
          </Text>
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  content: {
    padding: 16,
  },
  description: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  input: {
    fontSize: 16,
    color: '#fff',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,68,68,0.15)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#ff4444',
    flex: 1,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffaa00',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#444',
    opacity: 0.6,
  },
  generateText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a0a1a',
    letterSpacing: 1,
  },
  examplesSection: {
    marginBottom: 20,
  },
  examplesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
  },
  examplesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  exampleChip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: (SCREEN_WIDTH - 56) / 2,
  },
  exampleText: {
    fontSize: 12,
    color: '#aaa',
  },
  variationsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: 'center',
  },
  variationsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  variationCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 12,
    width: (SCREEN_WIDTH - 64) / 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  variationSelected: {
    borderColor: '#00ff88',
    backgroundColor: 'rgba(0,255,136,0.1)',
  },
  variationLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  variationInfo: {
    alignItems: 'center',
    marginTop: 4,
  },
  variationShape: {
    fontSize: 10,
    color: '#888',
    textTransform: 'capitalize',
  },
  variationAura: {
    fontSize: 9,
    color: '#666',
    textTransform: 'capitalize',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,255,136,0.3)',
    borderRadius: 10,
    padding: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 20,
  },
  useSkinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00ff88',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  useSkinText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0a0a1a',
  },
  mintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,170,0,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffaa00',
    gap: 6,
  },
  mintText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffaa00',
  },
  detailsSection: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
  },
  detailsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    width: '48%',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 10,
    color: '#666',
  },
  detailValue: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  colorPalette: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  colorSwatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  infoText: {
    fontSize: 11,
    color: '#666',
    flex: 1,
  },
});
