import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  SafeAreaView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { usePermissions } from '../../hooks/usePermissions';
import { PermissionRow } from '../../components/PermissionRow';
import ReelCounter from '../../modules/reelcounter-native/src';
import { Colors } from '../../constants/colors';
import { Spacing, Radius } from '../../constants/spacing';

export default function SettingsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { permissions, recheck } = usePermissions();
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [clearing, setClearing] = useState(false);

  // Load overlay pref on mount
  React.useEffect(() => {
    ReelCounter.getOverlayPreference().then(setOverlayEnabled).catch(() => {});
  }, []);

  const handleOverlayToggle = useCallback(async (val: boolean) => {
    setOverlayEnabled(val);
    try {
      await ReelCounter.setOverlayPreference(val);
    } catch {
      setOverlayEnabled(!val); // revert on error
    }
  }, []);

  const handleClearData = useCallback(() => {
    Alert.alert(
      'Clear all statistics?',
      'This will permanently delete all your reel counts and session history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            try {
              await ReelCounter.clearAllData();
            } catch {
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            } finally {
              setClearing(false);
            }
          },
        },
      ]
    );
  }, []);

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const trackingActive = permissions.accessibility;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.back, { color: colors.accent }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Tracking Status */}
        <SectionHeader title="Tracking Status" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <PermissionRow
            label="Accessibility Access"
            enabled={permissions.accessibility}
            onOpen={() => { ReelCounter.openAccessibilitySettings(); setTimeout(recheck, 2000); }}
          />
          <PermissionRow
            label="Display Overlay"
            enabled={permissions.overlay}
            onOpen={() => { ReelCounter.openOverlaySettings(); setTimeout(recheck, 2000); }}
          />
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Tracking Active</Text>
            <View style={[styles.statusChip, { backgroundColor: trackingActive ? '#1A3A2A' : colors.accentMuted }]}>
              <Text style={[styles.statusChipText, { color: trackingActive ? '#34C759' : colors.textSecondary }]}>
                {trackingActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>

        {/* Overlay */}
        <SectionHeader title="Overlay" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Show floating island</Text>
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                Display count above Instagram
              </Text>
            </View>
            <Switch
              value={overlayEnabled}
              onValueChange={handleOverlayToggle}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Data */}
        <SectionHeader title="Data" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.row, { borderBottomWidth: 0 }]}
            onPress={handleClearData}
            disabled={clearing}
          >
            {clearing ? (
              <ActivityIndicator color={colors.danger} />
            ) : (
              <Text style={[styles.rowLabel, { color: colors.danger }]}>Clear all statistics</Text>
            )}
            {!clearing && <Text style={{ color: colors.textSecondary }}>›</Text>}
          </TouchableOpacity>
        </View>

        {/* About */}
        <SectionHeader title="About" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>App</Text>
            <Text style={[styles.rowValue, { color: colors.textPrimary }]}>Flick</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Version</Text>
            <Text style={[styles.rowValue, { color: colors.textPrimary }]}>{version}</Text>
          </View>
        </View>

        <View style={[styles.privacyCard, { backgroundColor: colors.accentMuted }]}>
          <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
            🔒 Privacy: All data is stored locally on your device. No data is ever sent to any server, cloud service, or third party. Flick never reads Instagram content — only navigation events.
          </Text>
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, colors }: { title: string; colors: any }) {
  return (
    <Text style={[headerStyles.label, { color: colors.textSecondary }]}>
      {title}
    </Text>
  );
}

const headerStyles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingLeft: Spacing.xs,
    marginTop: Spacing.base,
    marginBottom: Spacing.xs,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  back: { fontSize: 15, fontWeight: '600', width: 60 },
  title: { fontSize: 17, fontWeight: '700' },
  content: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowSub: { fontSize: 12, fontWeight: '400', marginTop: 2 },
  rowValue: { fontSize: 15, fontWeight: '400' },
  statusChip: {
    borderRadius: 8,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  statusChipText: { fontSize: 12, fontWeight: '600' },
  privacyCard: {
    marginTop: Spacing.base,
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
  privacyText: { fontSize: 13, lineHeight: 19 },
});
