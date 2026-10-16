import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useReelStats } from '../../hooks/useReelStats';
import { DayRow } from '../../components/DayRow';
import { Colors } from '../../constants/colors';
import { Spacing, Radius } from '../../constants/spacing';

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export default function HistoryScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.back, { color: colors.accent }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>History</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {stats.dailySummary.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>No history yet.</Text>
        ) : (
          Object.entries(grouped).map(([month, days]) => (
            <View key={month} style={styles.monthGroup}>
              <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>{month}</Text>
              <View style={[styles.monthCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  back: { fontSize: 15, fontWeight: '600', width: 60 },
  title: { fontSize: 17, fontWeight: '700' },
  content: { paddingHorizontal: Spacing.base, gap: Spacing.base },
  monthGroup: { gap: Spacing.xs },
  monthLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingLeft: Spacing.xs,
  },
  monthCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  empty: { textAlign: 'center', marginTop: 80, fontSize: 16 },
});
