import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Spacing } from '../constants/spacing';
import { Fonts } from '../constants/typography';
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
  const d = new Date(dateStr + 'T12:00:00');
  return DAY_LABELS[d.getDay()];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const last7 = getLast7Days();
  const todayStr = last7[6];

  const countMap: Record<string, number> = {};
  for (const s of data) {
    countMap[s.localDate] = s.count;
  }

  const counts = last7.map((d) => countMap[d] ?? 0);
  const maxCount = Math.max(...counts, 1);
  const MAX_BAR_HEIGHT = 70;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Activity</Text>
      <View style={styles.chart}>
        {last7.map((dateStr, i) => {
          const count = counts[i];
          const isToday = dateStr === todayStr;
          const barHeight = Math.max((count / maxCount) * MAX_BAR_HEIGHT, count > 0 ? 8 : 4);
          const barColor = isToday || count > 0 ? '#FF6B00' : '#222226';
          const label = getDayLabel(dateStr);

          return (
            <View key={dateStr} style={styles.barGroup}>
              <Text style={styles.countLabel}>
                {count > 0 ? (count > 999 ? '999+' : count) : ''}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: barColor,
                      opacity: isToday ? 1 : count > 0 ? 0.75 : 0.4,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.dayLabel,
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
    paddingVertical: Spacing.xs,
  },
  title: {
    fontFamily: Fonts.manropeSemi,
    fontSize: 11,
    color: '#8E8E96',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.base,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: '45%',
    height: 70,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 3,
    minHeight: 4,
  },
  countLabel: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 9,
    color: '#8E8E96',
    marginBottom: 4,
    height: 12,
  },
  dayLabel: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 10,
    color: '#71717A',
    marginTop: 6,
    letterSpacing: -0.2,
  },
  dayLabelToday: {
    fontFamily: Fonts.manropeBold,
    color: '#FF6B00',
  },
});
