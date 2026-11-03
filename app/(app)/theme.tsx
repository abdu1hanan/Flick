import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReelCounter, { addThemeChangedListener } from '../../modules/reelcounter-native/src';
import { IslandPreview } from '../../components/IslandPreview';
import { Spacing, Radius } from '../../constants/spacing';
import { Fonts } from '../../constants/typography';
import type { IslandThemeId } from '../../types';

interface PresetItem {
  id: IslandThemeId;
  name: string;
  tag: string;
  desc: string;
}

const PRESETS: PresetItem[] = [
  {
    id: 'classic',
    name: 'Classic Island',
    tag: 'Sleek',
    desc: 'Deep obsidian pill with neon orange boundary glow',
  },
  {
    id: 'neko',
    name: 'Neko Cat',
    tag: 'Kawaii',
    desc: 'Cute cat ears silhouette with soft rose paw badge',
  },
  {
    id: 'pixel',
    name: 'Pixel Arcade',
    tag: '8-Bit',
    desc: 'Cyber arcade HUD with pixel alien and sharp corners',
  },
  {
    id: 'cloud',
    name: 'Cloud Bunny',
    tag: 'Dreamy',
    desc: 'Bubbly cloud silhouette with magical star sparkles',
  },
];

export default function ThemeScreen() {
  const insets = useSafeAreaInsets();
  const [selectedTheme, setSelectedTheme] = useState<IslandThemeId>('classic');
  const [tapToCycle, setTapToCycle] = useState(true);

  // Load preferences on mount
  useEffect(() => {
    ReelCounter.getTheme().then((theme) => {
      if (theme) setSelectedTheme(theme);
    }).catch(() => {});

    ReelCounter.getTapToCycleTheme().then(setTapToCycle).catch(() => {});

    // Listen to theme changes from native tap
    const sub = addThemeChangedListener((event) => {
      if (event.theme) setSelectedTheme(event.theme);
    });

    return () => {
      sub.remove();
    };
  }, []);

  const handleSelectTheme = useCallback(async (themeId: IslandThemeId) => {
    setSelectedTheme(themeId);
    try {
      await ReelCounter.setTheme(themeId);
    } catch {
      // Ignore
    }
  }, []);

  const handleToggleTapToCycle = useCallback(async (enabled: boolean) => {
    setTapToCycle(enabled);
    try {
      await ReelCounter.setTapToCycleTheme(enabled);
    } catch {
      setTapToCycle(!enabled);
    }
  }, []);

  const topPadding = Math.max(insets.top + 6, 40);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Text style={styles.backChevron}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Snackbar Themes</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Tap to cycle setting card */}
        <Text style={styles.sectionHeader}>Interaction</Text>
        <View style={styles.card}>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1, paddingRight: Spacing.md }}>
              <Text style={styles.rowLabel}>Tap to change theme</Text>
              <Text style={styles.rowSub}>
                Tap the floating snackbar while in Instagram to instantly cycle through presets
              </Text>
            </View>
            <Switch
              value={tapToCycle}
              onValueChange={handleToggleTapToCycle}
              trackColor={{ false: '#27272A', true: '#FF6B00' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* 2 by 2 Grid Presets */}
        <Text style={styles.sectionHeader}>Presets</Text>
        <View style={styles.grid}>
          {PRESETS.map((preset) => {
            const isSelected = selectedTheme === preset.id;
            return (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.presetCard,
                  isSelected && styles.presetCardSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => handleSelectTheme(preset.id)}
              >
                {/* Header tag */}
                <View style={styles.presetTop}>
                  <View
                    style={[
                      styles.tagBadge,
                      isSelected ? styles.tagBadgeActive : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        isSelected ? styles.tagTextActive : null,
                      ]}
                    >
                      {preset.tag}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={styles.activeCheckPill}>
                      <Text style={styles.activeCheckText}>✓ Active</Text>
                    </View>
                  )}
                </View>

                {/* Live Pill Preview */}
                <View style={styles.previewBox}>
                  <IslandPreview theme={preset.id} count={7} />
                </View>

                {/* Name & cute description */}
                <Text style={styles.presetName}>{preset.name}</Text>
                <Text style={styles.presetDesc}>{preset.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={() => router.back()}
        >
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
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
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backChevron: {
    fontSize: 28,
    color: '#FFFFFF',
    lineHeight: 32,
    fontFamily: Fonts.manropeMedium,
  },
  title: {
    fontFamily: Fonts.manropeBold,
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
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
    lineHeight: 16,
    letterSpacing: -0.1,
  },

  // ---- 2x2 Grid ----
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  presetCard: {
    width: '48%',
    backgroundColor: '#131316',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: '#202024',
    padding: Spacing.md,
    minHeight: 175,
    justifyContent: 'space-between',
  },
  presetCardSelected: {
    borderColor: '#FF6B00',
    backgroundColor: '#181514',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  presetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagBadge: {
    backgroundColor: '#1E1E24',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagBadgeActive: {
    backgroundColor: 'rgba(255, 107, 0, 0.18)',
  },
  tagText: {
    fontFamily: Fonts.manropeSemi,
    fontSize: 10,
    color: '#8E8E96',
    letterSpacing: 0.2,
  },
  tagTextActive: {
    color: '#FF6B00',
  },
  activeCheckPill: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeCheckText: {
    fontFamily: Fonts.manropeBold,
    fontSize: 9,
    color: '#000000',
  },
  previewBox: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  presetName: {
    fontFamily: Fonts.manropeBold,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  presetDesc: {
    fontFamily: Fonts.manropeRegular,
    fontSize: 11,
    color: '#8E8E96',
    marginTop: 2,
    lineHeight: 15,
  },

  bottomBar: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.xs,
    backgroundColor: '#09090B',
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

