import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { usePermissions } from '../../hooks/usePermissions';
import ReelCounter from '../../modules/reelcounter-native/src';
import { Spacing } from '../../constants/spacing';

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
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Step indicator */}
          <View style={styles.steps}>
            <View style={[styles.step, styles.stepDone]} />
            <View style={[styles.step, styles.stepActive]} />
            <View style={styles.step} />
          </View>

          <Text style={styles.stepLabel}>Step 2 of 3</Text>
          <Text style={styles.title}>Enable Accessibility</Text>
          <Text style={styles.description}>
            Flick uses Android{'\u2019'}s Accessibility service to detect when you{'\u2019'}re watching Reels.
            It{'\u2019'}s scoped to Instagram only and{'\n'}
            <Text style={styles.bold}>never reads, records, or stores any content.</Text>
          </Text>


          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>How to enable:</Text>
            {[
              'Tap "Open Accessibility Settings" below',
              'Find "Downloaded apps" or "Installed apps"',
              'Tap "Flick"',
              'Toggle "Use Flick" to ON',
              'Tap Allow when prompted',
            ].map((step, i) => (
              <View key={i} style={styles.instructionRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{step}</Text>
              </View>
            ))}
          </View>

          {permissions.accessibility && (
            <View style={styles.enabledBadge}>
              <Text style={styles.enabledText}>✓ Accessibility Enabled</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.primaryButton} onPress={openSettings}>
            <Text style={styles.primaryButtonText}>Open Accessibility Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={onNext}>
            <Text style={styles.secondaryButtonText}>
              {permissions.accessibility ? 'Continue →' : "I've enabled it →"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0E10' },
  safe: { flex: 1, paddingHorizontal: Spacing.xl },
  content: { paddingTop: Spacing.xxl, paddingBottom: Spacing.xl, gap: Spacing.base },
  steps: { flexDirection: 'row', gap: 6 },
  step: { flex: 1, height: 3, backgroundColor: '#2C2C30', borderRadius: 2 },
  stepDone: { backgroundColor: '#6B5CE7' },
  stepActive: { backgroundColor: '#8B7CF6' },
  stepLabel: { fontSize: 12, color: '#6B6B72', fontWeight: '500' },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginTop: Spacing.sm },
  description: { fontSize: 15, color: '#8A8A94', lineHeight: 22 },
  bold: { color: '#F0F0F4', fontWeight: '600' },
  instructionCard: {
    backgroundColor: '#1A1A1E',
    borderRadius: 16,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: '#2C2C30',
    gap: Spacing.sm,
  },
  instructionTitle: { fontSize: 13, fontWeight: '600', color: '#8A8A94', marginBottom: 4 },
  instructionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#6B5CE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  instructionText: { flex: 1, fontSize: 14, color: '#F0F0F4', lineHeight: 20 },
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
  secondaryButton: { alignItems: 'center', paddingVertical: 12 },
  secondaryButtonText: { color: '#8B7CF6', fontSize: 15, fontWeight: '600' },
});
