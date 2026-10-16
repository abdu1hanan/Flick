import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '../constants/colors';
import { Spacing, Radius } from '../constants/spacing';
import type { SessionStats } from '../types';

interface SessionStatsProps {
  stats: SessionStats;
}

function StatRow({ label, value }: { label: string; value: string }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

export function SessionStatsCard({ stats }: SessionStatsProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.cardBackground, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>Session Stats</Text>
      <StatRow label="Total sessions" value={String(stats.totalSessions)} />
      <StatRow label="Sessions today" value={String(stats.sessionsToday)} />
      <StatRow
        label="Avg reels / session"
        value={stats.avgReelsPerSession > 0 ? stats.avgReelsPerSession.toFixed(1) : '—'}
      />
      <StatRow
        label="Longest session"
        value={stats.longestSessionCount > 0 ? `${stats.longestSessionCount} reels` : '—'}
      />
      <StatRow
        label="7-day daily avg"
        value={stats.avgDailyReels > 0 ? stats.avgDailyReels.toFixed(1) : '—'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '400',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
