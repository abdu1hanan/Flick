import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { GlowingPillCelebration } from '../../components/GlowingPillCelebration';
import { Spacing } from '../../constants/spacing';
import { Fonts } from '../../constants/typography';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.inner}>
        <View style={styles.top}>
          {/* Static Glowing Pill with Google-style celebration sparkles */}
          <View style={styles.previewContainer}>
            <GlowingPillCelebration count={3} />
          </View>

          {/* Wordmark in Pixer font */}
          <Text style={styles.appName}>flick</Text>

          {/* Minimalist description in Manrope */}
          <Text style={styles.tagline}>Your scrolling, counted.</Text>
          <Text style={styles.description}>
            Counts your Instagram Reels automatically in a tiny floating island.
            Zero network. 100% on-device.
          </Text>
        </View>

        <View style={styles.bottom}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => router.push('/(onboarding)/accessibility')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  inner: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    justifyContent: 'space-between',
  },
  top: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  previewContainer: {
    marginBottom: Spacing.lg,
  },
  appName: {
    fontFamily: Fonts.pixel,
    fontSize: 52,
    color: '#FF6B00',
    letterSpacing: 2,
  },
  tagline: {
    fontFamily: Fonts.manropeBold,
    fontSize: 19,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginTop: 4,
    textAlign: 'center',
  },
  description: {
    fontFamily: Fonts.manropeRegular,
    fontSize: 14,
    color: '#8E8E96',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: -0.2,
    marginTop: Spacing.xs,
    maxWidth: 290,
  },
  bottom: {
    paddingBottom: Spacing.md,
  },
  primaryButton: {
    backgroundColor: '#141416',
    borderRadius: 500,
    borderWidth: 1,
    borderColor: '#27272A',
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    fontFamily: Fonts.manropeBold,
    color: '#FFFFFF',
    fontSize: 15,
    letterSpacing: -0.3,
  },
});
