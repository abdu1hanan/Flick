import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Spacing, Radius } from '../constants/spacing';
import { Fonts } from '../constants/typography';
import type { SessionStats } from '../types';

interface SessionStatsProps {
  stats: SessionStats;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function SessionStatsCard({ stats }: SessionStatsProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Session Analytics</Text>
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
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#202024',
    backgroundColor: '#131316',
    padding: Spacing.base,
  },
  title: {
    fontFamily: Fonts.manropeSemi,
    fontSize: 11,
    color: '#8E8E96',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#202024',
  },
  rowLabel: {
    fontFamily: Fonts.manropeRegular,
    fontSize: 13,
    color: '#8E8E96',
    letterSpacing: -0.2,
  },
  rowValue: {
    fontFamily: Fonts.manropeSemi,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
