import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Spacing } from '../constants/spacing';
import { Fonts } from '../constants/typography';

interface StatCardProps {
  label: string;
  value: number | string;
  accent?: boolean;
}

export function StatCard({ label, value, accent = false }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text
        style={[styles.value, { color: accent ? '#FF6B00' : '#FFFFFF' }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#202024',
    backgroundColor: '#131316',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: Fonts.manropeBold,
    fontSize: 20,
    letterSpacing: -0.6,
    marginBottom: 2,
  },
  label: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 10,
    color: '#8E8E96',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: -0.1,
  },
});
