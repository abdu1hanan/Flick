import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../constants/colors';

import { Spacing } from '../constants/spacing';

interface EmptyStateProps {
  onSetupPress?: () => void;
  showSetup?: boolean;
}

export function EmptyState({ onSetupPress, showSetup = false }: EmptyStateProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={styles.container}>
      {/* Simple SVG illustration: pill with wavy lines */}
      <Svg width={120} height={80} viewBox="0 0 120 80">
        {/* Pill shape */}
        <Path
          d="M20,40 Q20,20 40,20 L80,20 Q100,20 100,40 Q100,60 80,60 L40,60 Q20,60 20,40 Z"
          fill={colors.accentMuted}
          stroke={colors.accent}
          strokeWidth={2}
        />
        {/* Play triangle */}
        <Path d="M48,32 L48,48 L64,40 Z" fill={colors.accent} />
        {/* Wavy lines suggesting motion */}
        <Path
          d="M108,28 Q114,24 108,20"
          stroke={colors.accent}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          opacity={0.5}
        />
        <Path
          d="M112,40 Q118,36 112,32"
          stroke={colors.accent}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          opacity={0.3}
        />
        <Path
          d="M108,52 Q114,48 108,44"
          stroke={colors.accent}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          opacity={0.5}
        />
      </Svg>

      <Text style={[styles.title, { color: colors.textPrimary }]}>No reels counted yet.</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Open Instagram Reels and your counter will appear automatically.
      </Text>

      {showSetup && onSetupPress && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent }]}
          onPress={onSetupPress}
        >
          <Text style={styles.buttonText}>Set up permissions →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: Spacing.base,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 14,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
