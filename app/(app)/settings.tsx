import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { usePermissions } from '../../hooks/usePermissions';
import { PermissionRow } from '../../components/PermissionRow';
import ReelCounter from '../../modules/reelcounter-native/src';
import { Spacing, Radius } from '../../constants/spacing';
import { Fonts } from '../../constants/typography';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
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
      setOverlayEnabled(!val);
    }
  }, []);

  const handleClearData = useCallback(() => {
    Alert.alert(
      'Clear all statistics?',
      'This will permanently delete all your reel counts and session history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            try {
              await ReelCounter.clearAllData();
            } catch {
              Alert.alert('Error', 'Failed to clear data.');
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
  const topPadding = Math.max(insets.top + 6, 40);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Text style={styles.backButton}>&larr; Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Tracking Status */}
        <Text style={styles.sectionHeader}>Tracking Status</Text>
        <View style={styles.card}>
          <PermissionRow
            label="Accessibility Service"
            enabled={permissions.accessibility}
            onOpen={() => {
              ReelCounter.openAccessibilitySettings();
              setTimeout(recheck, 2000);
            }}
          />
          <PermissionRow
            label="Display Overlay"
            enabled={permissions.overlay}
            onOpen={() => {
              ReelCounter.openOverlaySettings();
              setTimeout(recheck, 2000);
            }}
          />
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>Tracking Active</Text>
            <View
              style={[
                styles.statusChip,
                {
                  backgroundColor: trackingActive
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusChipText,
                  { color: trackingActive ? '#10B981' : '#EF4444' },
                ]}
              >
                {trackingActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>

        {/* Overlay */}
        <Text style={styles.sectionHeader}>Floating Island</Text>
        <View style={styles.card}>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View>
              <Text style={styles.rowLabel}>Show Island Overlay</Text>
              <Text style={styles.rowSub}>Display pill counter while in Instagram</Text>
            </View>
            <Switch
              value={overlayEnabled}
              onValueChange={handleOverlayToggle}
              trackColor={{ false: '#27272A', true: '#FF6B00' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Data */}
        <Text style={styles.sectionHeader}>Data Management</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.row, { borderBottomWidth: 0 }]}
            onPress={handleClearData}
            disabled={clearing}
            activeOpacity={0.7}
          >
            {clearing ? (
              <ActivityIndicator color="#EF4444" size="small" />
            ) : (
              <Text style={[styles.rowLabel, { color: '#EF4444' }]}>
                Clear all statistics
              </Text>
            )}
            {!clearing && <Text style={{ color: '#8E8E96' }}>&rsaquo;</Text>}
          </TouchableOpacity>
        </View>

        {/* About */}
        <Text style={styles.sectionHeader}>About</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>App</Text>
            <Text style={styles.appWordmark}>flick</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>{version}</Text>
          </View>
        </View>

        <View style={styles.privacyCard}>
          <Text style={styles.privacyText}>
            Privacy: All data is stored purely on your phone. No network connections, telemetry, or analytics are used. Flick only reads scroll navigation events inside Instagram.
          </Text>
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    backgroundColor: '#09090B',
  },
  backButton: {
    fontFamily: Fonts.manropeBold,
    fontSize: 14,
    color: '#FF6B00',
    width: 60,
  },
  title: {
    fontFamily: Fonts.manropeBold,
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  content: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
  },
  sectionHeader: {
    fontFamily: Fonts.manropeSemi,
    fontSize: 11,
    color: '#8E8E96',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingLeft: Spacing.xs,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#202024',
    backgroundColor: '#131316',
    paddingHorizontal: Spacing.base,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#202024',
  },
  rowLabel: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  rowSub: {
    fontFamily: Fonts.manropeRegular,
    fontSize: 12,
    color: '#8E8E96',
    marginTop: 2,
    letterSpacing: -0.1,
  },
  rowValue: {
    fontFamily: Fonts.manropeRegular,
    fontSize: 14,
    color: '#8E8E96',
  },
  appWordmark: {
    fontFamily: Fonts.pixel,
    fontSize: 18,
    color: '#FF6B00',
  },
  statusChip: {
    borderRadius: 500,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusChipText: {
    fontFamily: Fonts.manropeSemi,
    fontSize: 12,
    letterSpacing: -0.2,
  },
  privacyCard: {
    marginTop: Spacing.base,
    borderRadius: Radius.md,
    padding: Spacing.base,
    backgroundColor: '#131316',
    borderWidth: 1,
    borderColor: '#202024',
  },
  privacyText: {
    fontFamily: Fonts.manropeRegular,
    fontSize: 12,
    lineHeight: 18,
    color: '#71717A',
    letterSpacing: -0.1,
  },
});
