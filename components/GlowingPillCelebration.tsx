import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Fonts } from '../constants/typography';

interface GlowingPillCelebrationProps {
  count?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  type: 'dot' | 'spark';
}

const PARTICLES: Particle[] = [
  { id: 1, x: -75, y: -24, size: 5, color: '#FF6B00', delay: 0, type: 'dot' },
  { id: 2, x: 80, y: -20, size: 4, color: '#FFA040', delay: 200, type: 'dot' },
  { id: 3, x: -60, y: 28, size: 4, color: '#FF7D1A', delay: 400, type: 'dot' },
  { id: 4, x: 70, y: 26, size: 6, color: '#FF6B00', delay: 600, type: 'dot' },
  { id: 5, x: 0, y: -42, size: 5, color: '#FF9533', delay: 300, type: 'spark' },
  { id: 6, x: -95, y: 4, size: 4, color: '#FF5500', delay: 500, type: 'spark' },
  { id: 7, x: 95, y: 2, size: 5, color: '#FFA756', delay: 700, type: 'spark' },
  { id: 8, x: 25, y: 38, size: 4, color: '#FF6B00', delay: 150, type: 'dot' },
];

function CelebrationParticle({ particle }: { particle: Particle }) {
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(particle.delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [anim, particle.delay]);

  const scale = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1.2, 0.4],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.4, 0.8, 1],
    outputRange: [0, 0.95, 0.7, 0],
  });
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [particle.y, particle.y + (particle.y > 0 ? 6 : -6)],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          backgroundColor: particle.color,
          transform: [
            { translateX: particle.x },
            { translateY },
            { scale },
          ],
          opacity,
        },
      ]}
    />
  );
}

export function GlowingPillCelebration({ count = 3 }: GlowingPillCelebrationProps) {
  const label = count === 1 ? `${count} reel` : `${count} reels`;

  return (
    <View style={styles.container}>
      {/* Celebration particles floating around the boundary */}
      {PARTICLES.map((p) => (
        <CelebrationParticle key={p.id} particle={p} />
      ))}

      {/* Static Glowing Pill — NO up/down bounce, boundary glow only */}
      <View style={styles.pillGlowWrapper}>
        <View style={styles.pill}>
          <Text style={styles.pillIcon}>▶</Text>
          <Text style={styles.pillText}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 110,
    width: 240,
  },
  particle: {
    position: 'absolute',
  },
  pillGlowWrapper: {
    borderRadius: 500,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 500,
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 0, 0.7)',
  },
  pillIcon: {
    color: '#FF6B00',
    fontSize: 12,
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Fonts.manropeSemi,
    letterSpacing: -0.3,
  },
});
