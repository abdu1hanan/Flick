import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Fonts } from '../constants/typography';
import type { IslandThemeId } from '../types';

interface IslandPreviewProps {
  count?: number;
  theme?: IslandThemeId;
}

/** Static decorative pill that mirrors the floating island design with distinct presets */
export function IslandPreview({ count = 0, theme = 'classic' }: IslandPreviewProps) {
  const isPixel = theme === 'pixel';
  const label = isPixel
    ? (count === 1 ? `${count} REEL` : `${count} REELS`)
    : (count === 1 ? `${count} reel` : `${count} reels`);

  if (theme === 'neko') {
    return (
      <View style={styles.nekoWrapper}>
        {/* Adorable Cat Ears */}
        <View style={styles.earsRow}>
          <View style={[styles.ear, styles.leftEar]} />
          <View style={[styles.ear, styles.rightEar]} />
        </View>
        <View style={styles.nekoGlow}>
          <View style={styles.nekoPill}>
            <Text style={styles.nekoIcon}>🐾</Text>
            <Text style={styles.nekoText}>{label}</Text>
          </View>
        </View>
      </View>
    );
  }

  if (theme === 'pixel') {
    return (
      <View style={styles.pixelGlow}>
        <View style={styles.pixelPill}>
          <Text style={styles.pixelIcon}>👾</Text>
          <Text style={styles.pixelText}>{label}</Text>
        </View>
      </View>
    );
  }

  if (theme === 'cloud') {
    return (
      <View style={styles.cloudGlow}>
        <View style={styles.cloudPill}>
          <Text style={styles.cloudIcon}>✨</Text>
          <Text style={styles.cloudText}>{label}</Text>
        </View>
      </View>
    );
  }

  // Classic Island
  return (
    <View style={styles.classicGlow}>
      <View style={styles.classicPill}>
        <Text style={styles.classicIcon}>▶</Text>
        <Text style={styles.classicText}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ---- Classic ----
  classicGlow: {
    borderRadius: 500,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
    alignSelf: 'center',
  },
  classicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 500,
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 7,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 107, 0, 0.7)',
  },
  classicIcon: {
    color: '#FF6B00',
    fontSize: 10,
  },
  classicText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: Fonts.manropeSemi,
    letterSpacing: -0.3,
  },

  // ---- Neko Cat ----
  nekoWrapper: {
    alignItems: 'center',
    alignSelf: 'center',
  },
  earsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 22,
    marginBottom: -4,
    zIndex: 1,
  },
  ear: {
    width: 10,
    height: 10,
    backgroundColor: '#1E1428',
    borderColor: '#FF7597',
    borderWidth: 1.5,
    borderRadius: 3,
  },
  leftEar: {
    transform: [{ rotate: '-20deg' }],
  },
  rightEar: {
    transform: [{ rotate: '20deg' }],
  },
  nekoGlow: {
    borderRadius: 500,
    shadowColor: '#FF7597',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  nekoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161122',
    borderRadius: 500,
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 7,
    borderWidth: 1.5,
    borderColor: '#FF7597',
  },
  nekoIcon: {
    fontSize: 12,
  },
  nekoText: {
    color: '#FFF0F5',
    fontSize: 13,
    fontFamily: Fonts.manropeSemi,
    letterSpacing: -0.2,
  },

  // ---- Pixel Arcade ----
  pixelGlow: {
    borderRadius: 4,
    shadowColor: '#00FFA3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
    alignSelf: 'center',
  },
  pixelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090E17',
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 7,
    borderWidth: 1.8,
    borderColor: '#00FFA3',
  },
  pixelIcon: {
    fontSize: 12,
  },
  pixelText: {
    color: '#E2FFF5',
    fontSize: 12,
    fontFamily: Fonts.pixel,
    letterSpacing: 0.5,
  },

  // ---- Cloud Bunny ----
  cloudGlow: {
    borderRadius: 24,
    shadowColor: '#8C9EFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
    alignSelf: 'center',
  },
  cloudPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#11142A',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 7,
    borderWidth: 1.5,
    borderColor: '#8C9EFF',
  },
  cloudIcon: {
    fontSize: 12,
  },
  cloudText: {
    color: '#EDE7F6',
    fontSize: 13,
    fontFamily: Fonts.manropeSemi,
    letterSpacing: -0.2,
  },
});
