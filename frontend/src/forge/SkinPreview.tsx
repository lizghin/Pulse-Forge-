// SVG Skin Renderer - Converts recipe to visual SVG

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { 
  Circle, 
  Polygon, 
  Defs, 
  RadialGradient, 
  LinearGradient,
  Stop, 
  Ellipse,
  Path,
  Rect,
} from 'react-native-svg';
import { SkinRecipe } from './skinForge';

interface SkinPreviewProps {
  recipe: SkinRecipe;
  size?: number;
  animated?: boolean;
}

export function SkinPreview({ recipe, size = 100, animated = true }: SkinPreviewProps) {
  const center = size / 2;
  const coreRadius = size * 0.3;
  const auraRadius = size * 0.45;
  
  // Ensure glowIntensity has a valid value
  const glowIntensity = recipe?.glowIntensity || 0.5;
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {/* Core Gradient */}
          <RadialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={recipe.primaryColor} stopOpacity={1} />
            <Stop offset="70%" stopColor={recipe.secondaryColor} stopOpacity={0.9} />
            <Stop offset="100%" stopColor={recipe.accentColor} stopOpacity={0.7} />
          </RadialGradient>
          
          {/* Aura Gradient */}
          <RadialGradient id="auraGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={recipe.primaryColor} stopOpacity={glowIntensity * 0.5} />
            <Stop offset="100%" stopColor={recipe.primaryColor} stopOpacity={0} />
          </RadialGradient>
          
          {/* Outline Gradient */}
          <LinearGradient id="outlineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={recipe.outlineColor} />
            <Stop offset="50%" stopColor={recipe.accentColor} />
            <Stop offset="100%" stopColor={recipe.outlineColor} />
          </LinearGradient>
        </Defs>
        
        {/* Aura Layer */}
        {renderAura(recipe, center, auraRadius, glowIntensity)}
        
        {/* Particle Layer */}
        {renderParticles(recipe, center, auraRadius)}
        
        {/* Core Shape */}
        {renderCore(recipe, center, coreRadius)}
        
        {/* Inner Glow */}
        <Circle
          cx={center}
          cy={center}
          r={coreRadius * 0.4}
          fill="white"
          opacity={0.8}
        />
      </Svg>
    </View>
  );
}

// Core Shape Renderer
function renderCore(recipe: SkinRecipe, center: number, radius: number) {
  const outlineWidth = recipe.outlineStyle === 'none' ? 0 : 
                       recipe.outlineStyle === 'double' ? 4 : 2;
  const strokeDasharray = recipe.outlineStyle === 'dashed' ? '5,3' : undefined;
  const stroke = recipe.outlineStyle === 'gradient' ? 'url(#outlineGradient)' : recipe.outlineColor;
  
  const commonProps = {
    fill: 'url(#coreGradient)',
    stroke: recipe.outlineStyle !== 'none' ? stroke : 'none',
    strokeWidth: outlineWidth,
    strokeDasharray,
  };

  switch (recipe.baseShape) {
    case 'hexagon':
      return (
        <Polygon
          points={getHexagonPoints(center, center, radius)}
          {...commonProps}
        />
      );
    
    case 'diamond':
      return (
        <Polygon
          points={getDiamondPoints(center, center, radius)}
          {...commonProps}
        />
      );
    
    case 'star':
      return (
        <Polygon
          points={getStarPoints(center, center, radius, radius * 0.5, 5)}
          {...commonProps}
        />
      );
    
    case 'ring':
      return (
        <>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={recipe.primaryColor}
            strokeWidth={radius * 0.3}
            opacity={0.8}
          />
          <Circle
            cx={center}
            cy={center}
            r={radius * 0.5}
            fill={recipe.secondaryColor}
            opacity={0.9}
          />
        </>
      );
    
    case 'circle':
    default:
      return (
        <Circle
          cx={center}
          cy={center}
          r={radius}
          {...commonProps}
        />
      );
  }
}

// Aura Renderer
function renderAura(recipe: SkinRecipe, center: number, radius: number, glowIntensity: number) {
  switch (recipe.auraType) {
    case 'rings':
      return (
        <>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={recipe.primaryColor}
            strokeWidth={1.5}
            opacity={0.6 * glowIntensity}
          />
          <Circle
            cx={center}
            cy={center}
            r={radius * 1.15}
            fill="none"
            stroke={recipe.primaryColor}
            strokeWidth={1.5}
            opacity={0.45 * glowIntensity}
          />
          <Circle
            cx={center}
            cy={center}
            r={radius * 1.3}
            fill="none"
            stroke={recipe.primaryColor}
            strokeWidth={1.5}
            opacity={0.3 * glowIntensity}
          />
        </>
      );
    
    case 'pulse':
      return (
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="url(#auraGradient)"
        />
      );
    
    case 'glitch':
      return (
        <>
          <Rect
            x={center - radius}
            y={center - 2}
            width={radius * 2}
            height={4}
            fill={recipe.accentColor}
            opacity={0.5 * glowIntensity}
          />
          <Rect
            x={center - 3}
            y={center - radius * 0.8}
            width={6}
            height={radius * 1.6}
            fill={recipe.secondaryColor}
            opacity={0.4 * glowIntensity}
          />
        </>
      );
    
    case 'flame':
      return (
        <>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x = center + Math.cos(rad) * radius * 0.7;
            const y = center + Math.sin(rad) * radius * 0.7;
            return (
              <Ellipse
                key={`flame-${i}`}
                cx={x}
                cy={y}
                rx={radius * 0.15}
                ry={radius * 0.25}
                fill={i % 2 === 0 ? recipe.primaryColor : recipe.secondaryColor}
                opacity={0.6 * glowIntensity}
              />
            );
          })}
        </>
      );
    
    case 'electric':
      return (
        <>
          {[0, 72, 144, 216, 288].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const startX = center + Math.cos(rad) * radius * 0.5;
            const startY = center + Math.sin(rad) * radius * 0.5;
            const endX = center + Math.cos(rad) * radius * 1.1;
            const endY = center + Math.sin(rad) * radius * 1.1;
            const midX = (startX + endX) / 2 + (i % 2 === 0 ? 5 : -5);
            const midY = (startY + endY) / 2 + (i % 2 === 0 ? -5 : 5);
            return (
              <Path
                key={`electric-${i}`}
                d={`M${startX},${startY} L${midX},${midY} L${endX},${endY}`}
                stroke={recipe.accentColor}
                strokeWidth={2}
                fill="none"
                opacity={0.8 * glowIntensity}
              />
            );
          })}
        </>
      );
    
    case 'glow':
    default:
      return (
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="url(#auraGradient)"
        />
      );
  }
}

// Particle Renderer
function renderParticles(recipe: SkinRecipe, center: number, radius: number) {
  if (recipe.particleStyle === 'none') return null;
  
  const particleCount = 8;
  const particles = [];
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    const dist = radius * (0.8 + Math.sin(i * 1.5) * 0.3);
    const x = center + Math.cos(angle) * dist;
    const y = center + Math.sin(angle) * dist;
    const size = 2 + (i % 3);
    
    switch (recipe.particleStyle) {
      case 'sparks':
        particles.push(
          <Circle
            key={`spark-${i}`}
            cx={x}
            cy={y}
            r={size}
            fill={i % 2 === 0 ? recipe.accentColor : recipe.primaryColor}
            opacity={0.8}
          />
        );
        break;
      
      case 'dots':
        particles.push(
          <Circle
            key={`dot-${i}`}
            cx={x}
            cy={y}
            r={size * 0.8}
            fill={recipe.secondaryColor}
            opacity={0.6}
          />
        );
        break;
      
      case 'stars':
        particles.push(
          <Polygon
            key={`star-${i}`}
            points={getStarPoints(x, y, size * 1.5, size * 0.6, 4)}
            fill={recipe.accentColor}
            opacity={0.7}
          />
        );
        break;
      
      case 'bubbles':
        particles.push(
          <Circle
            key={`bubble-${i}`}
            cx={x}
            cy={y}
            r={size * 1.2}
            fill="none"
            stroke={recipe.primaryColor}
            strokeWidth={1}
            opacity={0.5}
          />
        );
        break;
      
      case 'lightning':
        if (i % 2 === 0) {
          particles.push(
            <Path
              key={`lightning-${i}`}
              d={`M${x},${y - size * 2} L${x + size},${y} L${x - size},${y} L${x},${y + size * 2}`}
              stroke={recipe.accentColor}
              strokeWidth={1.5}
              fill="none"
              opacity={0.7}
            />
          );
        }
        break;
    }
  }
  
  return <>{particles}</>;
}

// Helper functions for shape generation
function getHexagonPoints(cx: number, cy: number, r: number): string {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 - 30) * (Math.PI / 180);
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return points.join(' ');
}

function getDiamondPoints(cx: number, cy: number, r: number): string {
  return `${cx},${cy - r} ${cx + r * 0.7},${cy} ${cx},${cy + r} ${cx - r * 0.7},${cy}`;
}

function getStarPoints(cx: number, cy: number, outerR: number, innerR: number, points: number): string {
  const result = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    result.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return result.join(' ');
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Export a simplified game-ready renderer
export function getSkinColors(recipe: SkinRecipe | null | undefined) {
  if (!recipe) {
    return {
      coreColor: '#00ffff',
      glowColor: '#00ffff',
      phaseColor: '#ff00ff',
    };
  }
  
  return {
    coreColor: recipe.primaryColor,
    glowColor: recipe.secondaryColor,
    phaseColor: recipe.accentColor,
  };
}
