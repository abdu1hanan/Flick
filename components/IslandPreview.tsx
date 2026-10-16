import React from 'react';
import { View, Text, StyleSheet } from 'react-native';


/** Static decorative pill that mirrors the floating island design */
export function IslandPreview({ count = 0 }: { count?: number }) {
  const label = count === 1 ? `${count} reel` : `${count} reels`;
  return (
    <View style={styles.pill}>
      <Text style={styles.icon}>▶</Text>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 500,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 6,
  },
  icon: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
