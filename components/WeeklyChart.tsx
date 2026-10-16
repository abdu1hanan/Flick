import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import type { DailySummary } from '../types';

interface WeeklyChartProps {
  data: DailySummary[];
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    days.push(`${y}-${m}-${day}`);
  }
  return days;
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00'); // noon to avoid DST edge
  return DAY_LABELS[d.getDay()];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const last7 = getLast7Days();
  const todayStr = last7[6];

  // Build a lookup map from summary data
  const countMap: Record<string, number> = {};
  for (const s of data) {
    countMap[s.localDate] = s.count;
  }

  const counts = last7.map((d) => countMap[d] ?? 0);
  const maxCount = Math.max(...counts, 1);

  const MAX_BAR_HEIGHT = 80;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>This Week</Text>
      <View style={styles.chart}>
        {last7.map((dateStr, i) => {
          const count = counts[i];
          const isToday = dateStr === todayStr;
          const barHeight = Math.max((count / maxCount) * MAX_BAR_HEIGHT, count > 0 ? 6 : 3);
          const barColor = isToday ? colors.accent : colors.chartBarInactive;
          const label = getDayLabel(dateStr);

          return (
            <View key={dateStr} style={styles.barGroup}>
              <Text style={[styles.countLabel, { color: colors.textSecondary }]}>
                {count > 0 ? (count > 999 ? '999+' : count) : ''}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: barColor,
                      opacity: isToday ? 1 : 0.65,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.dayLabel,
                  { color: isToday ? colors.accent : colors.textSecondary },
                  isToday && styles.dayLabelToday,
                ]}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.sm,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 110,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: '60%',
    height: 80,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 3,
  },
  countLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 2,
    height: 12,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
  dayLabelToday: {
    fontWeight: '700',
  },
});
