// Skin Forge System - Deterministic cosmetic generation from text prompts

import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES
// ============================================

export interface SkinRecipe {
  id: string;
  prompt: string;
  seed: string;
  createdAt: number;
  
  // Visual properties
  baseShape: 'circle' | 'hexagon' | 'diamond' | 'star' | 'ring';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  auraType: 'glow' | 'rings' | 'pulse' | 'glitch' | 'flame' | 'electric';
  particleStyle: 'sparks' | 'dots' | 'stars' | 'none' | 'bubbles' | 'lightning';
  outlineStyle: 'solid' | 'dashed' | 'double' | 'none' | 'gradient';
  outlineColor: string;
  
  // Animation hints
  pulseSpeed: number; // 0.5 - 2.0
  rotationSpeed: number; // 0 - 1
  glowIntensity: number; // 0.3 - 1.0
  
  // NFT metadata
  mintedOnChain?: boolean;
  tokenId?: string;
  transactionHash?: string;
}

export interface ForgedSkin {
  recipe: SkinRecipe;
  isMinted: boolean;
  isEquipped: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const FORGE_STORAGE_KEY = '@pulse_forge_skins';
const EQUIPPED_SKIN_KEY = '@pulse_forge_equipped_skin';
const CONSTANT_SALT = 'PULSE_FORGE_2024_COSMETIC_ONLY';

// Color palettes based on keywords
const COLOR_PALETTES: Record<string, string[]> = {
  fire: ['#ff4500', '#ff6600', '#ffaa00', '#ff2200'],
  ice: ['#00d4ff', '#00aaff', '#88ddff', '#ffffff'],
  nature: ['#00ff88', '#44ff00', '#88ff44', '#00aa44'],
  void: ['#8800ff', '#6600cc', '#aa44ff', '#440088'],
  gold: ['#ffd700', '#ffaa00', '#ffcc44', '#cc8800'],
  shadow: ['#333333', '#555555', '#222222', '#444444'],
  neon: ['#ff00ff', '#00ffff', '#ffff00', '#ff0088'],
  cosmic: ['#6600ff', '#ff00aa', '#00ffaa', '#aa00ff'],
  blood: ['#cc0000', '#880000', '#ff2222', '#660000'],
  ocean: ['#0066cc', '#0088ff', '#00aacc', '#004488'],
  sunset: ['#ff6644', '#ff8866', '#ffaa88', '#cc4422'],
  forest: ['#228822', '#44aa44', '#66cc66', '#116611'],
  electric: ['#00ffff', '#88ffff', '#00ccff', '#44ddff'],
  toxic: ['#88ff00', '#aaff44', '#66cc00', '#44aa00'],
  crystal: ['#aaddff', '#cceeFF', '#88ccff', '#ffffff'],
  default: ['#00ffff', '#0088ff', '#44ddff', '#00aaaa'],
};

const AURA_KEYWORDS: Record<string, SkinRecipe['auraType']> = {
  glow: 'glow', glowing: 'glow', shine: 'glow', bright: 'glow',
  ring: 'rings', rings: 'rings', orbit: 'rings', halo: 'rings',
  pulse: 'pulse', pulsing: 'pulse', beat: 'pulse', heart: 'pulse',
  glitch: 'glitch', broken: 'glitch', corrupt: 'glitch', error: 'glitch',
  flame: 'flame', fire: 'flame', burn: 'flame', hot: 'flame',
  electric: 'electric', lightning: 'electric', thunder: 'electric', spark: 'electric',
};

const PARTICLE_KEYWORDS: Record<string, SkinRecipe['particleStyle']> = {
  spark: 'sparks', sparks: 'sparks', sparkle: 'sparks',
  dot: 'dots', dots: 'dots', orbs: 'dots',
  star: 'stars', stars: 'stars', stellar: 'stars', galaxy: 'stars',
  bubble: 'bubbles', bubbles: 'bubbles', float: 'bubbles',
  lightning: 'lightning', bolt: 'lightning', zap: 'lightning',
  clean: 'none', minimal: 'none', simple: 'none',
};

const SHAPE_KEYWORDS: Record<string, SkinRecipe['baseShape']> = {
  hex: 'hexagon', hexagon: 'hexagon', geometric: 'hexagon',
  diamond: 'diamond', gem: 'diamond', crystal: 'diamond',
  star: 'star', stellar: 'star',
  ring: 'ring', hollow: 'ring', donut: 'ring',
  circle: 'circle', orb: 'circle', sphere: 'circle', round: 'circle',
};

// ============================================
// CONTENT MODERATION
// ============================================

const BLOCKED_WORDS = [
  // Hate speech
  'nazi', 'hitler', 'kkk', 'racist', 'hate',
  // Sexual content
  'porn', 'sex', 'nsfw', 'nude', 'naked',
  // Violence
  'kill', 'murder', 'terrorist', 'bomb',
  // Illegal
  'drug', 'cocaine', 'heroin',
];

export function isPromptSafe(prompt: string): { safe: boolean; reason?: string } {
  const lower = prompt.toLowerCase();
  
  for (const word of BLOCKED_WORDS) {
    if (lower.includes(word)) {
      return { 
        safe: false, 
        reason: 'Your prompt contains content that violates our guidelines. Please try a different description.' 
      };
    }
  }
  
  if (prompt.length < 3) {
    return { safe: false, reason: 'Please enter a longer description (at least 3 characters).' };
  }
  
  if (prompt.length > 200) {
    return { safe: false, reason: 'Please keep your description under 200 characters.' };
  }
  
  return { safe: true };
}

// ============================================
// DETERMINISTIC GENERATION
// ============================================

function generateSeed(prompt: string, variation: number = 0): string {
  const normalized = prompt.toLowerCase().trim();
  const timestamp = Math.floor(Date.now() / 86400000); // Day-based
  const input = `${normalized}-${variation}-${timestamp}-${CONSTANT_SALT}`;
  return CryptoJS.SHA256(input).toString();
}

function seedToNumber(seed: string, offset: number = 0): number {
  const subset = seed.substring(offset, offset + 8);
  return parseInt(subset, 16) / 0xffffffff;
}

function detectColorPalette(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  
  for (const [keyword, palette] of Object.entries(COLOR_PALETTES)) {
    if (lower.includes(keyword)) {
      return palette;
    }
  }
  
  // Check for color words
  if (lower.includes('red') || lower.includes('crimson')) return COLOR_PALETTES.blood;
  if (lower.includes('blue') || lower.includes('cyan')) return COLOR_PALETTES.ice;
  if (lower.includes('green') || lower.includes('emerald')) return COLOR_PALETTES.nature;
  if (lower.includes('purple') || lower.includes('violet')) return COLOR_PALETTES.void;
  if (lower.includes('yellow') || lower.includes('golden')) return COLOR_PALETTES.gold;
  if (lower.includes('pink') || lower.includes('magenta')) return COLOR_PALETTES.neon;
  if (lower.includes('orange')) return COLOR_PALETTES.sunset;
  if (lower.includes('white') || lower.includes('light')) return COLOR_PALETTES.crystal;
  if (lower.includes('black') || lower.includes('dark')) return COLOR_PALETTES.shadow;
  
  return COLOR_PALETTES.default;
}

function detectAuraType(prompt: string, seed: string): SkinRecipe['auraType'] {
  const lower = prompt.toLowerCase();
  
  for (const [keyword, aura] of Object.entries(AURA_KEYWORDS)) {
    if (lower.includes(keyword)) {
      return aura;
    }
  }
  
  // Random based on seed
  const auras: SkinRecipe['auraType'][] = ['glow', 'rings', 'pulse', 'glitch', 'flame', 'electric'];
  const index = Math.floor(seedToNumber(seed, 0) * auras.length);
  return auras[index];
}

function detectParticleStyle(prompt: string, seed: string): SkinRecipe['particleStyle'] {
  const lower = prompt.toLowerCase();
  
  for (const [keyword, style] of Object.entries(PARTICLE_KEYWORDS)) {
    if (lower.includes(keyword)) {
      return style;
    }
  }
  
  const styles: SkinRecipe['particleStyle'][] = ['sparks', 'dots', 'stars', 'none', 'bubbles', 'lightning'];
  const index = Math.floor(seedToNumber(seed, 8) * styles.length);
  return styles[index];
}

function detectBaseShape(prompt: string, seed: string): SkinRecipe['baseShape'] {
  const lower = prompt.toLowerCase();
  
  for (const [keyword, shape] of Object.entries(SHAPE_KEYWORDS)) {
    if (lower.includes(keyword)) {
      return shape;
    }
  }
  
  const shapes: SkinRecipe['baseShape'][] = ['circle', 'hexagon', 'diamond', 'star', 'ring'];
  const index = Math.floor(seedToNumber(seed, 16) * shapes.length);
  return shapes[index];
}

function detectOutlineStyle(prompt: string, seed: string): SkinRecipe['outlineStyle'] {
  const lower = prompt.toLowerCase();
  
  if (lower.includes('clean') || lower.includes('minimal')) return 'none';
  if (lower.includes('dashed') || lower.includes('dotted')) return 'dashed';
  if (lower.includes('double') || lower.includes('thick')) return 'double';
  if (lower.includes('gradient') || lower.includes('rainbow')) return 'gradient';
  
  const styles: SkinRecipe['outlineStyle'][] = ['solid', 'dashed', 'double', 'none', 'gradient'];
  const index = Math.floor(seedToNumber(seed, 24) * styles.length);
  return styles[index];
}

export function generateSkinRecipe(prompt: string, variation: number = 0): SkinRecipe {
  const seed = generateSeed(prompt, variation);
  const palette = detectColorPalette(prompt);
  
  // Use seed to pick colors from palette
  const primaryIndex = Math.floor(seedToNumber(seed, 32) * palette.length);
  const secondaryIndex = Math.floor(seedToNumber(seed, 40) * palette.length);
  const accentIndex = Math.floor(seedToNumber(seed, 48) * palette.length);
  
  return {
    id: `skin_${seed.substring(0, 12)}`,
    prompt,
    seed,
    createdAt: Date.now(),
    
    baseShape: detectBaseShape(prompt, seed),
    primaryColor: palette[primaryIndex],
    secondaryColor: palette[secondaryIndex],
    accentColor: palette[accentIndex],
    auraType: detectAuraType(prompt, seed),
    particleStyle: detectParticleStyle(prompt, seed),
    outlineStyle: detectOutlineStyle(prompt, seed),
    outlineColor: palette[Math.floor(seedToNumber(seed, 56) * palette.length)],
    
    pulseSpeed: 0.5 + seedToNumber(seed, 64) * 1.5,
    rotationSpeed: seedToNumber(seed, 72),
    glowIntensity: 0.3 + seedToNumber(seed, 80) * 0.7,
  };
}

export function generateSkinVariations(prompt: string, count: number = 3): SkinRecipe[] {
  return Array.from({ length: count }, (_, i) => generateSkinRecipe(prompt, i));
}

// ============================================
// PERSISTENCE
// ============================================

export async function saveForgedSkin(recipe: SkinRecipe): Promise<void> {
  try {
    console.log('[skinForge] Saving skin:', recipe.id);
    const existing = await loadForgedSkins();
    console.log('[skinForge] Existing skins:', existing.length);
    const updated = [...existing.filter(s => s.id !== recipe.id), recipe];
    await AsyncStorage.setItem(FORGE_STORAGE_KEY, JSON.stringify(updated));
    console.log('[skinForge] Saved! Total skins now:', updated.length);
    
    // Verify save worked
    const verify = await AsyncStorage.getItem(FORGE_STORAGE_KEY);
    console.log('[skinForge] Verify saved data length:', verify?.length || 0);
  } catch (error) {
    console.error('Failed to save forged skin:', error);
    throw error;
  }
}

export async function loadForgedSkins(): Promise<SkinRecipe[]> {
  try {
    console.log('[skinForge] Loading forged skins...');
    const data = await AsyncStorage.getItem(FORGE_STORAGE_KEY);
    console.log('[skinForge] Raw data from storage:', data ? data.substring(0, 100) : 'null');
    const parsed = data ? JSON.parse(data) : [];
    console.log('[skinForge] Loaded skins count:', parsed.length);
    return parsed;
  } catch (error) {
    console.error('Failed to load forged skins:', error);
    return [];
  }
}

export async function deleteForgedSkin(skinId: string): Promise<void> {
  try {
    const existing = await loadForgedSkins();
    const updated = existing.filter(s => s.id !== skinId);
    await AsyncStorage.setItem(FORGE_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to delete forged skin:', error);
  }
}

export async function setEquippedSkin(skinId: string | null): Promise<void> {
  try {
    if (skinId) {
      await AsyncStorage.setItem(EQUIPPED_SKIN_KEY, skinId);
    } else {
      await AsyncStorage.removeItem(EQUIPPED_SKIN_KEY);
    }
  } catch (error) {
    console.error('Failed to set equipped skin:', error);
  }
}

export async function getEquippedSkin(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(EQUIPPED_SKIN_KEY);
  } catch (error) {
    console.error('Failed to get equipped skin:', error);
    return null;
  }
}

// ============================================
// NFT METADATA GENERATION
// ============================================

export function generateNFTMetadata(recipe: SkinRecipe): object {
  return {
    name: `Pulse Core #${recipe.id.substring(5, 11).toUpperCase()}`,
    description: `A unique Pulse Forge core skin. Created from: "${recipe.prompt}"`,
    image: '', // Will be filled with SVG data or IPFS URI
    external_url: 'https://pulseforge.game',
    attributes: [
      { trait_type: 'Shape', value: recipe.baseShape },
      { trait_type: 'Aura', value: recipe.auraType },
      { trait_type: 'Particles', value: recipe.particleStyle },
      { trait_type: 'Outline', value: recipe.outlineStyle },
      { trait_type: 'Primary Color', value: recipe.primaryColor },
      { trait_type: 'Secondary Color', value: recipe.secondaryColor },
      { trait_type: 'Glow Intensity', value: Math.round(recipe.glowIntensity * 100) },
    ],
    properties: {
      prompt: recipe.prompt,
      seed: recipe.seed,
      recipe: recipe,
    },
  };
}

// ============================================
// PROMPT EXAMPLES
// ============================================

export const PROMPT_EXAMPLES = [
  'Fiery phoenix with golden sparks',
  'Frozen crystal orb with ice rings',
  'Void shadow with purple glitch effects',
  'Electric neon core with lightning',
  'Forest spirit with nature particles',
  'Cosmic galaxy core with stellar dots',
  'Blood moon hexagon with dark aura',
  'Golden sun diamond with warm glow',
  'Toxic green ring with bubbles',
  'Ocean wave circle with flowing particles',
];
