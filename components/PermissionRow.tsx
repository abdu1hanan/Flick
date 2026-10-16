import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '../constants/colors';
import { Spacing, Radius } from '../constants/spacing';

interface PermissionRowProps {
  label: string;
  enabled: boolean;
  onOpen: () => void;
}

export function PermissionRow({ label, enabled, onOpen }: PermissionRowProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.left}>
        <View style={[styles.dot, { backgroundColor: enabled ? '#34C759' : '#FF3B30' }]} />
        <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      </View>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.accentMuted }]}
        onPress={onOpen}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.buttonText, { color: colors.accent }]}>
          {enabled ? 'Enabled ✓' : 'Enable →'}
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
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
