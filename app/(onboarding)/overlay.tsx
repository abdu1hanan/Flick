import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReelCounter from '../../modules/reelcounter-native/src';
import { usePermissions } from '../../hooks/usePermissions';
import { Spacing } from '../../constants/spacing';

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
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          {/* Step indicator */}
          <View style={styles.steps}>
            <View style={[styles.step, styles.stepDone]} />
            <View style={[styles.step, styles.stepDone]} />
            <View style={[styles.step, styles.stepActive]} />
          </View>
          <Text style={styles.stepLabel}>Step 3 of 3</Text>

          <Text style={styles.title}>Allow Overlay</Text>
          <Text style={styles.description}>
            This lets Flick display the floating island above Instagram.
            {'\n\n'}
            <Text style={styles.muted}>
              If you skip this, Flick will still count reels — you just won{'\u2019'}t see
              the floating island.
            </Text>

          </Text>

          {/* Visual: show where the island appears */}
          <View style={styles.preview}>
            <View style={styles.mockStatusBar} />
            <View style={styles.mockIsland}>
              <Text style={styles.mockIslandText}>▶  3 reels</Text>
            </View>
            <View style={styles.mockContent}>
              <Text style={styles.mockLabel}>Instagram Reels</Text>
            </View>
          </View>

          {permissions.overlay && (
            <View style={styles.enabledBadge}>
              <Text style={styles.enabledText}>✓ Overlay Enabled</Text>
            </View>
          )}
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.primaryButton} onPress={openSettings}>
            <Text style={styles.primaryButtonText}>Open Overlay Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.doneButton} onPress={onDone}>
            <Text style={styles.doneButtonText}>
              {permissions.overlay ? "All set! Let's go →" : 'Skip & Continue →'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0E10' },
  safe: { flex: 1, paddingHorizontal: Spacing.xl, justifyContent: 'space-between' },
  content: { flex: 1, paddingTop: Spacing.xxl, gap: Spacing.base },
  steps: { flexDirection: 'row', gap: 6 },
  step: { flex: 1, height: 3, backgroundColor: '#2C2C30', borderRadius: 2 },
  stepDone: { backgroundColor: '#6B5CE7' },
  stepActive: { backgroundColor: '#8B7CF6' },
  stepLabel: { fontSize: 12, color: '#6B6B72', fontWeight: '500' },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginTop: Spacing.sm },
  description: { fontSize: 15, color: '#F0F0F4', lineHeight: 22 },
  muted: { color: '#6B6B72' },
  preview: {
    backgroundColor: '#1A1A1E',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2C2C30',
    height: 160,
    marginTop: Spacing.base,
  },
  mockStatusBar: { height: 20, backgroundColor: '#111' },
  mockIsland: {
    backgroundColor: '#000',
    borderRadius: 500,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'center',
    marginTop: 4,
  },
  mockIslandText: { color: '#FFF', fontWeight: '600', fontSize: 12 },
  mockContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mockLabel: { color: '#2C2C30', fontSize: 12 },
  enabledBadge: {
    backgroundColor: '#1A3A2A',
    borderRadius: 10,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#34C759',
  },
  enabledText: { color: '#34C759', fontWeight: '600', fontSize: 14 },
  buttons: { paddingBottom: Spacing.xl, gap: Spacing.sm },
  primaryButton: {
    backgroundColor: '#6B5CE7',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  doneButton: { alignItems: 'center', paddingVertical: 12 },
  doneButtonText: { color: '#8B7CF6', fontSize: 15, fontWeight: '600' },
});
