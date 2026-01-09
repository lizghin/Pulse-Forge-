// Forge Skin Screen - Create custom skins from text prompts
// Fixed: Action buttons moved outside ScrollView for web compatibility

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
  withTiming,
  runOnJS,
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
  const [toast, setToast] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Animation values for cards
  const card0Scale = useSharedValue(1);
  const card1Scale = useSharedValue(1);
  const card2Scale = useSharedValue(1);
  const toastOpacity = useSharedValue(0);
  
  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  const showToast = useCallback((message: string) => {
    setToast(message);
    toastOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(1, { duration: 1500 }),
      withTiming(0, { duration: 300 })
    );
    setTimeout(() => setToast(null), 2000);
  }, [toastOpacity]);

  const handleGenerate = useCallback(async () => {
    setError(null);
    
    // Validate prompt
    const validation = isPromptSafe(prompt);
    if (!validation.safe) {
      setError(validation.reason || 'Invalid prompt');
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    
    console.log('[Forge] Generating skins for prompt:', prompt);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setIsGenerating(true);
    setVariations([]);
    setSelectedIndex(null);
    
    // Simulate slight delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate 3 variations
    const newVariations = generateSkinVariations(prompt, 3);
    console.log('[Forge] Generated', newVariations.length, 'variations');
    setVariations(newVariations);
    setIsGenerating(false);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
  }, [prompt]);

  const handleSelectSkin = useCallback((index: number) => {
    console.log('[Forge] Selected skin index:', index);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    // Animate card scale
    const scales = [card0Scale, card1Scale, card2Scale];
    scales[index].value = withSequence(
      withSpring(1.1, { damping: 8 }),
      withSpring(1, { damping: 12 })
    );
    setSelectedIndex(index);
  }, [card0Scale, card1Scale, card2Scale]);

  // Main handler for using skin - with multiple fallbacks
  const handleUseSkin = useCallback(async () => {
    console.log('[Forge] handleUseSkin called! selectedIndex:', selectedIndex);
    
    if (selectedIndex === null) {
      console.log('[Forge] No skin selected, aborting');
      return;
    }
    
    if (isSaving) {
      console.log('[Forge] Already saving, aborting');
      return;
    }
    
    setIsSaving(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    
    const selected = variations[selectedIndex];
    console.log('[Forge] Using skin:', selected.id, selected.baseShape);
    
    try {
      // Save the skin
      console.log('[Forge] Saving skin...');
      await saveForgedSkin(selected);
      console.log('[Forge] Skin saved!');
      
      // Set as equipped
      console.log('[Forge] Setting as equipped...');
      await setEquippedSkin(selected.id);
      console.log('[Forge] Skin equipped!');
      
      // Notify parent
      onSkinCreated(selected);
      
      // Show success toast
      showToast('Equipped ✓');
      console.log('[Forge] Success! Navigating back...');
      
      // Navigate back after short delay to show toast
      setTimeout(() => {
        onBack();
      }, 800);
      
    } catch (err) {
      console.error('[Forge] Error saving skin:', err);
      setError('Failed to save skin. Please try again.');
      setIsSaving(false);
    }
  }, [selectedIndex, variations, onBack, onSkinCreated, isSaving, showToast]);

  const handleExamplePress = useCallback((example: string) => {
    console.log('[Forge] Example pressed:', example);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setPrompt(example);
    setError(null);
    setVariations([]);
    setSelectedIndex(null);
  }, []);

  const handleMintNFT = useCallback(() => {
    if (selectedIndex === null) return;
    
    console.log('[Forge] Mint NFT pressed');
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    
    if (Platform.OS === 'web') {
      showToast('NFT minting coming soon!');
    } else {
      Alert.alert(
        'Mint as NFT',
        'NFT minting on testnet coming soon! For now, your skin is saved locally and usable in-game.',
        [{ text: 'Got it!' }]
      );
    }
  }, [selectedIndex, showToast]);
  
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
  
  const toastStyle = useAnimatedStyle(() => ({
    opacity: toastOpacity.value,
  }));

  // Web-safe button component with multiple event handlers
  const ActionButton = ({ onAction, style, children, disabled }: {
    onAction: () => void;
    style: any;
    children: React.ReactNode;
    disabled?: boolean;
  }) => {
    const handlePress = () => {
      console.log('[ActionButton] onPress fired');
      if (!disabled) onAction();
    };
    
    const handlePointerUp = () => {
      console.log('[ActionButton] onPointerUp fired');
      if (!disabled) onAction();
    };
    
    // Use Pressable with multiple event handlers for reliability
    return (
      <Pressable
        style={({ pressed }) => [
          style,
          pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
          disabled && { opacity: 0.5 }
        ]}
        onPress={handlePress}
        // @ts-ignore - Web fallback
        onPointerUp={Platform.OS === 'web' ? handlePointerUp : undefined}
        disabled={disabled}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Toast Notification */}
      {toast && (
        <Animated.View style={[styles.toast, toastStyle]}>
          <Ionicons name="checkmark-circle" size={20} color="#00ff88" />
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}
      
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

      {/* Scrollable Content */}
      <ScrollView 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
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
          style={[styles.generateButton, (!prompt.trim() || isGenerating) && styles.generateButtonDisabled]}
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
        <View style={styles.examplesSection}>
          <Text style={styles.examplesTitle}>TRY THESE EXAMPLES</Text>
          <View style={styles.examplesGrid}>
            {PROMPT_EXAMPLES.slice(0, 8).map((example, index) => (
              <TouchableOpacity
                key={index}
                style={styles.exampleChip}
                onPress={() => handleExamplePress(example)}
              >
                <Text style={styles.exampleText} numberOfLines={1}>{example}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
                    <Text style={styles.detailLabel}>Outline</Text>
                    <Text style={styles.detailValue}>{variations[selectedIndex].outlineStyle}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Particles</Text>
                    <Text style={styles.detailValue}>{variations[selectedIndex].particleStyle}</Text>
                  </View>
                </View>
                
                {/* Color Palette */}
                <View style={styles.colorPalette}>
                  <View style={[styles.colorSwatch, { backgroundColor: variations[selectedIndex].primaryColor }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: variations[selectedIndex].secondaryColor }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: variations[selectedIndex].accentColor }]} />
                </View>
              </View>
            )}
          </View>
        )}
        
        {/* Spacer for fixed footer */}
        {selectedIndex !== null && <View style={{ height: 100 }} />}
      </ScrollView>

      {/* Fixed Footer with Action Buttons - OUTSIDE ScrollView for web compatibility */}
      {selectedIndex !== null && (
        <View style={styles.fixedFooter}>
          <ActionButton
            onAction={handleUseSkin}
            style={styles.useSkinButton}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#0a0a1a" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#0a0a1a" />
                <Text style={styles.useSkinText}>USE THIS SKIN</Text>
              </>
            )}
          </ActionButton>

          <ActionButton
            onAction={handleMintNFT}
            style={styles.mintButton}
            disabled={isSaving}
          >
            <Ionicons name="diamond" size={18} color="#ffaa00" />
            <Text style={styles.mintText}>MINT NFT</Text>
          </ActionButton>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  toast: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,255,136,0.2)',
    borderWidth: 1,
    borderColor: '#00ff88',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1000,
  },
  toastText: {
    color: '#00ff88',
    fontWeight: '700',
    fontSize: 14,
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
    paddingBottom: 20,
  },
  description: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
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
    color: '#555',
    textAlign: 'right',
    marginTop: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,68,68,0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 13,
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
  generateButtonDisabled: {
    opacity: 0.5,
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
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  variationCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    width: (SCREEN_WIDTH - 64) / 3,
  },
  variationSelected: {
    borderColor: '#00ff88',
    backgroundColor: 'rgba(0,255,136,0.1)',
  },
  variationLabel: {
    fontSize: 14,
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
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0a0a1a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  useSkinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00ff88',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    flex: 1,
    maxWidth: 200,
    cursor: 'pointer',
  },
  useSkinText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0a0a1a',
  },
  mintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,170,0,0.2)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffaa00',
    gap: 6,
    cursor: 'pointer',
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
    marginTop: 8,
  },
  detailsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 2,
    marginBottom: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    width: '45%',
  },
  detailLabel: {
    fontSize: 10,
    color: '#555',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    color: '#fff',
    textTransform: 'capitalize',
  },
  colorPalette: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    justifyContent: 'center',
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});
