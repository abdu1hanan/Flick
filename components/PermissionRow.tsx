import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Spacing } from '../constants/spacing';
import { Fonts } from '../constants/typography';

interface PermissionRowProps {
  label: string;
  enabled: boolean;
  onOpen: () => void;
}

export function PermissionRow({ label, enabled, onOpen }: PermissionRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={[styles.dot, { backgroundColor: enabled ? '#10B981' : '#EF4444' }]} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: enabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 107, 0, 0.12)' },
        ]}
        onPress={onOpen}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonText, { color: enabled ? '#10B981' : '#FF6B00' }]}>
          {enabled ? 'Active ✓' : 'Enable &rarr;'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#202024',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  label: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  button: {
    borderRadius: 500,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  buttonText: {
    fontFamily: Fonts.manropeSemi,
    fontSize: 12,
    letterSpacing: -0.2,
  },
});
