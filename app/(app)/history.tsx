import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReelStats } from '../../hooks/useReelStats';
import { DayRow } from '../../components/DayRow';
import { Spacing, Radius } from '../../constants/spacing';
import { Fonts } from '../../constants/typography';

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { stats, refresh } = useReelStats();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const todayStr = todayDateStr();

  // Group by month
  const grouped: Record<string, typeof stats.dailySummary> = {};
  for (const day of stats.dailySummary) {
    const monthKey = getMonthLabel(day.localDate);
    if (!grouped[monthKey]) grouped[monthKey] = [];
    grouped[monthKey].push(day);
  }

  const topPadding = Math.max(insets.top + 6, 40);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Text style={styles.backButton}>&larr; Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B00"
          />
        }
      >
        {stats.dailySummary.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.empty}>No history yet.</Text>
          </View>
        ) : (
          Object.entries(grouped).map(([month, days]) => (
            <View key={month} style={styles.monthGroup}>
              <Text style={styles.monthLabel}>{month}</Text>
              <View style={styles.monthCard}>
                {days.map((day) => (
                  <DayRow
                    key={day.localDate}
                    localDate={day.localDate}
                    count={day.count}
                    isToday={day.localDate === todayStr}
                  />
                ))}
              </View>
            </View>
          ))
        )}
        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    backgroundColor: '#09090B',
  },
  backButton: {
    fontFamily: Fonts.manropeBold,
    fontSize: 14,
    color: '#FF6B00',
    width: 60,
  },
  title: {
    fontFamily: Fonts.manropeBold,
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  content: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.base,
    paddingTop: Spacing.xs,
  },
  monthGroup: {
    gap: Spacing.xs,
  },
  monthLabel: {
    fontFamily: Fonts.manropeSemi,
    fontSize: 11,
    color: '#8E8E96',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingLeft: Spacing.xs,
  },
  monthCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#202024',
    backgroundColor: '#131316',
    paddingHorizontal: Spacing.base,
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
  },
  empty: {
    fontFamily: Fonts.manropeRegular,
    fontSize: 15,
    color: '#71717A',
  },
});
