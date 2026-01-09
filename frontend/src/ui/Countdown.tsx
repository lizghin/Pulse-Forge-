// Countdown overlay before run starts

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CountdownProps {
  onComplete: () => void;
}

export function Countdown({ onComplete }: CountdownProps) {
  const [count, setCount] = useState(3);
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const animate = () => {
      scale.value = 0.5;
      opacity.value = 1;
      
      scale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withTiming(1, { duration: 200 })
      );
      
      setTimeout(() => {
        opacity.value = withTiming(0, { duration: 200 });
      }, 700);
    };

    animate();

    const timer = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(timer);
          setTimeout(onComplete, 300);
          return 0;
        }
        setTimeout(animate, 50);
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.overlay} />
      <Animated.View style={[styles.countContainer, animatedStyle]}>
        <Text style={styles.count}>{count === 0 ? 'GO!' : count}</Text>
      </Animated.View>
      <Text style={styles.tip}>HOLD to charge • RELEASE to pulse</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  countContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,255,255,0.2)',
    borderWidth: 4,
    borderColor: '#00ffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  count: {
    fontSize: 56,
    fontWeight: '900',
    color: '#00ffff',
  },
  tip: {
    position: 'absolute',
    bottom: 100,
    fontSize: 14,
    color: '#888',
    letterSpacing: 1,
  },
});
