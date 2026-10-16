import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Spacing } from '../../constants/spacing';

export default function WelcomeScreen() {
  const [floatAnim] = useState(() => new Animated.Value(0));


  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim]);

  return (
    <View style={[styles.container, { backgroundColor: '#0E0E10' }]}>
      <SafeAreaView style={styles.inner}>
        <View style={styles.top}>
          {/* Animated floating pill */}
          <Animated.View style={[styles.pillWrapper, { transform: [{ translateY: floatAnim }] }]}>
            <View style={styles.pill}>
              <Text style={styles.pillIcon}>▶</Text>
              <Text style={styles.pillText}>3 reels</Text>
            </View>
          </Animated.View>

          <Text style={styles.appName}>Flick</Text>
          <Text style={styles.tagline}>Your scrolling, counted.</Text>
          <Text style={styles.description}>
            Flick counts your Instagram Reels automatically and shows your progress
            in a tiny floating island — above Instagram, below your camera.
          </Text>
        </View>

        <View style={styles.bottom}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(onboarding)/accessibility')}
          >
            <Text style={styles.primaryButtonText}>Get Started →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    justifyContent: 'space-between',
  },
  top: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.base,
  },
  pillWrapper: {
    marginBottom: Spacing.xxl,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1E',
    borderRadius: 500,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#2C2C30',
    shadowColor: '#6B5CE7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  pillIcon: {
    color: '#8B7CF6',
    fontSize: 14,
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  appName: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '500',
    color: '#8A8A94',
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B6B72',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  bottom: {
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: '#6B5CE7',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
