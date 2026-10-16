import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Fonts } from '../constants/typography';

/** Static decorative pill that mirrors the floating island design with subtle orange boundary glow */
export function IslandPreview({ count = 0 }: { count?: number }) {
  const label = count === 1 ? `${count} reel` : `${count} reels`;
  return (
    <View style={styles.pillGlow}>
      <View style={styles.pill}>
        <Text style={styles.icon}>▶</Text>
        <Text style={styles.text}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pillGlow: {
    borderRadius: 500,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
    alignSelf: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 500,
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 7,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 107, 0, 0.6)',
  },
  icon: {
    color: '#FF6B00',
    fontSize: 10,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: Fonts.manropeSemi,
    letterSpacing: -0.3,
  },
});
