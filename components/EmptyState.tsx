import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IslandPreview } from './IslandPreview';
import { Spacing } from '../constants/spacing';
import { Fonts } from '../constants/typography';

interface EmptyStateProps {
  onSetupPress?: () => void;
  showSetup?: boolean;
}

export function EmptyState({ onSetupPress, showSetup = false }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {/* Centered clean island preview */}
      <View style={styles.pillWrapper}>
        <IslandPreview count={0} />
      </View>

      <Text style={styles.title}>No reels counted yet</Text>
      <Text style={styles.subtitle}>
        Open Instagram and scroll through Reels. Your daily count will track automatically.
      </Text>

      {showSetup && onSetupPress && (
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.85}
          onPress={onSetupPress}
        >
          <Text style={styles.buttonText}>Enable Permissions</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  pillWrapper: {
    marginBottom: Spacing.base,
  },
  title: {
    fontFamily: Fonts.manropeBold,
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Fonts.manropeRegular,
    fontSize: 14,
    color: '#8E8E96',
    textAlign: 'center',
    lineHeight: 21,
    letterSpacing: -0.2,
    maxWidth: 260,
  },
  button: {
    marginTop: Spacing.base,
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#27272A',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 500,
  },
  buttonText: {
    fontFamily: Fonts.manropeBold,
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: -0.2,
  },
});
