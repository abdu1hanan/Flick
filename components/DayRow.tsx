import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Spacing } from '../constants/spacing';
import { Fonts } from '../constants/typography';

interface DayRowProps {
  localDate: string; // "YYYY-MM-DD"
  count: number;
  isToday?: boolean;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function DayRow({ localDate, count, isToday = false }: DayRowProps) {
  const d = new Date(localDate + 'T12:00:00');
  const dayName = isToday ? 'Today' : DAY_NAMES[d.getDay()];
  const dateLabel = `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={[styles.dayName, isToday && styles.todayText]}>
          {dayName}
        </Text>
        <Text style={styles.dateLabel}>{dateLabel}</Text>
      </View>
      <View style={styles.right}>
        <View
          style={[
            styles.bar,
            {
              width: Math.min(Math.max(count * 1.5, count > 0 ? 8 : 2), 90),
              backgroundColor: isToday || count > 0 ? '#FF6B00' : '#222226',
              opacity: isToday ? 1 : 0.6,
            },
          ]}
        />
        <Text style={[styles.count, isToday && styles.todayText]}>
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
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#202024',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dayName: {
    fontFamily: Fonts.manropeSemi,
    fontSize: 13,
    color: '#FFFFFF',
    width: 44,
    letterSpacing: -0.2,
  },
  todayText: {
    color: '#FF6B00',
  },
  dateLabel: {
    fontFamily: Fonts.manropeRegular,
    fontSize: 13,
    color: '#8E8E96',
    letterSpacing: -0.2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bar: {
    height: 5,
    borderRadius: 3,
  },
  count: {
    fontFamily: Fonts.manropeBold,
    fontSize: 14,
    color: '#FFFFFF',
    width: 36,
    textAlign: 'right',
    letterSpacing: -0.3,
  },
});
