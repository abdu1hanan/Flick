import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { usePermissions } from '../../hooks/usePermissions';
import ReelCounter from '../../modules/reelcounter-native/src';
import { Spacing } from '../../constants/spacing';
import { Fonts } from '../../constants/typography';

export default function AccessibilityScreen() {
  const { permissions, recheck } = usePermissions();

  async function openSettings() {
    ReelCounter.openAccessibilitySettings();
  }

  async function onNext() {
    await recheck();
    router.push('/(onboarding)/overlay');
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.inner}>
        <View style={styles.centerContent}>
          {/* Title */}
          <Text style={styles.title}>Enable Accessibility</Text>

          {/* Minimal description */}
          <Text style={styles.description}>
            Detects when Instagram Reels are scrolled.
            {'\n'}Never reads or saves any screen content.
          </Text>

          {/* Clean, centered, small steps */}
          <View style={styles.stepsContainer}>
            <Text style={styles.stepItem}>1. Tap Open Settings below</Text>
            <Text style={styles.stepItem}>2. Tap Installed Apps &rarr; Flick</Text>
            <Text style={styles.stepItem}>3. Turn on &ldquo;Use Flick&rdquo;</Text>
          </View>

          {permissions.accessibility && (
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>✓ Accessibility Active</Text>
            </View>
          )}
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottom}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={openSettings}
          >
            <Text style={styles.primaryButtonText}>Open Settings</Text>
          </TouchableOpacity>

          {/* Very small, underlined white link */}
          <TouchableOpacity
            style={styles.linkButton}
            activeOpacity={0.7}
            onPress={onNext}
          >
            <Text style={styles.linkText}>
              {permissions.accessibility ? 'Continue' : "I've enabled it"}
            </Text>
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.manropeBold,
    fontSize: 24,
    color: '#FFFFFF',
    letterSpacing: -0.6,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  description: {
    fontFamily: Fonts.manropeRegular,
    fontSize: 14,
    color: '#8E8E96',
    textAlign: 'center',
    lineHeight: 21,
    letterSpacing: -0.2,
    maxWidth: 270,
    marginBottom: Spacing.lg,
  },
  stepsContainer: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 16,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#202024',
    width: '100%',
    maxWidth: 290,
  },
  stepItem: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 13,
    color: '#D4D4D8',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  statusPill: {
    marginTop: Spacing.lg,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 500,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusText: {
    fontFamily: Fonts.manropeSemi,
    fontSize: 12,
    color: '#10B981',
    letterSpacing: -0.2,
  },
  bottom: {
    paddingBottom: Spacing.md,
    gap: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#141416',
    borderRadius: 500,
    borderWidth: 1,
    borderColor: '#27272A',
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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
  linkButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  linkText: {
    fontFamily: Fonts.manropeMedium,
    color: '#FFFFFF',
    fontSize: 12,
    textDecorationLine: 'underline',
    letterSpacing: -0.2,
  },
});
