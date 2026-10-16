import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';

interface DayRowProps {
  localDate: string; // "YYYY-MM-DD"
  count: number;
  isToday?: boolean;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function DayRow({ localDate, count, isToday = false }: DayRowProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const d = new Date(localDate + 'T12:00:00');
  const dayName = isToday ? 'Today' : DAY_NAMES[d.getDay()];
  const dateLabel = `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.left}>
        <Text style={[styles.dayName, { color: isToday ? colors.accent : colors.textPrimary }]}>
          {dayName}
        </Text>
        <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>{dateLabel}</Text>
      </View>
      <View style={styles.right}>
        <View
          style={[
            styles.bar,
            {
              width: Math.max(count * 1.5, count > 0 ? 8 : 2),
              maxWidth: 100,
              backgroundColor: isToday ? colors.accent : colors.chartBarInactive,
            },
          ]}
        />
        <Text style={[styles.count, { color: isToday ? colors.accent : colors.textPrimary }]}>
          {count}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    width: 44,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '400',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },
  count: {
    fontSize: 14,
    fontWeight: '700',
    width: 36,
    textAlign: 'right',
  },
});
