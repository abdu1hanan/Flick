import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReelCounter from '../../modules/reelcounter-native/src';
import { usePermissions } from '../../hooks/usePermissions';
import { GlowingPillCelebration } from '../../components/GlowingPillCelebration';
import { Spacing } from '../../constants/spacing';
import { Fonts } from '../../constants/typography';

const ONBOARDING_KEY = 'flick_onboarding_completed';

export default function OverlayScreen() {
  const { permissions } = usePermissions();

  async function openSettings() {
    ReelCounter.openOverlaySettings();
  }

  async function onDone() {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(app)');
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.inner}>
        <View style={styles.centerContent}>
          {/* Same Celebration Glow Pill as Screen 1 */}
          <View style={styles.previewContainer}>
            <GlowingPillCelebration count={3} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Allow Overlay</Text>

          {/* Minimal description */}
          <Text style={styles.description}>
            Displays the subtle pill counter right above Instagram while you scroll.
          </Text>

          {permissions.overlay && (
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>✓ Overlay Permission Active</Text>
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
            <Text style={styles.primaryButtonText}>Open Overlay Settings</Text>
          </TouchableOpacity>

          {/* Very small, underlined white link */}
          <TouchableOpacity
            style={styles.linkButton}
            activeOpacity={0.7}
            onPress={onDone}
          >
            <Text style={styles.linkText}>
              {permissions.overlay ? 'All set, enter Flick' : 'Skip for now'}
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
  previewContainer: {
    marginBottom: Spacing.base,
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
