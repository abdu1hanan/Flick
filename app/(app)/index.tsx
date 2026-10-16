import React, { useState, useCallback } from 'react';
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
import { useReelEvent } from '../../hooks/useReelEvent';
import { usePermissions } from '../../hooks/usePermissions';
import { StatCard } from '../../components/StatCard';
import { WeeklyChart } from '../../components/WeeklyChart';
import { SessionStatsCard } from '../../components/SessionStats';
import { DayRow } from '../../components/DayRow';
import { IslandPreview } from '../../components/IslandPreview';
import { EmptyState } from '../../components/EmptyState';
import { Colors } from '../../constants/colors';
import { Spacing, Radius } from '../../constants/spacing';

function todayDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function DashboardScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { stats, loading, refresh } = useReelStats();
  const { permissions } = usePermissions();
  const [todayLive, setTodayLive] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Live update from native event
  useReelEvent((event) => {
    setTodayLive(event.todayCount);
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setTodayLive(null);
    setRefreshing(false);
  }, [refresh]);

  const displayToday = todayLive ?? stats.todayCount;
  const isEmpty = stats.allTimeTotal === 0 && !loading;
  const todayStr = todayDateStr();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IslandPreview count={displayToday} />
        </View>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Flick</Text>
        <TouchableOpacity
          style={styles.headerRight}
          onPress={() => router.push('/(app)/settings')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.settingsIcon, { color: colors.textSecondary }]}>⚙</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {isEmpty ? (
          <EmptyState
            showSetup={!permissions.accessibility || !permissions.overlay}
            onSetupPress={() => router.push('/(app)/settings')}
          />
        ) : (
          <>
            {/* Hero card */}
            <View style={[styles.heroCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Text style={[styles.heroNumber, { color: colors.accent }]}>{displayToday}</Text>
              <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>reels today</Text>
              <View style={{ marginTop: Spacing.base }}>
                <IslandPreview count={displayToday} />
              </View>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <StatCard label="Today" value={displayToday} accent />
              <StatCard label="Yesterday" value={stats.yesterdayCount} />
              <StatCard label="7 days" value={stats.last7DaysTotal} />
              <StatCard label="All time" value={stats.allTimeTotal} />
            </View>

            {/* Weekly chart */}
            <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <WeeklyChart data={stats.dailySummary} />
            </View>

            {/* Session stats */}
            <SessionStatsCard stats={stats.sessionStats} />

            {/* Recent days */}
            <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Days</Text>
              {stats.dailySummary.slice(0, 7).map((day) => (
                <DayRow
                  key={day.localDate}
                  localDate={day.localDate}
                  count={day.count}
                  isToday={day.localDate === todayStr}
                />
              ))}
              {stats.dailySummary.length > 7 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => router.push('/(app)/history')}
                >
                  <Text style={[styles.viewAllText, { color: colors.accent }]}>
                    View all history →
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Permission warning if missing */}
            {(!permissions.accessibility || !permissions.overlay) && (
              <TouchableOpacity
                style={[styles.warningBanner, { borderColor: colors.border }]}
                onPress={() => router.push('/(app)/settings')}
              >
                <Text style={[styles.warningText, { color: colors.textSecondary }]}>
                  {!permissions.accessibility
                    ? '⚠ Accessibility access required to count reels →'
                    : '⚠ Overlay permission needed for floating island →'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerLeft: { flex: 1 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    flex: 1,
  },
  headerRight: { flex: 1, alignItems: 'flex-end' },
  settingsIcon: { fontSize: 22 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  heroCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  heroNumber: {
    fontSize: 80,
    fontWeight: '800',
    letterSpacing: -3,
    lineHeight: 88,
  },
  heroLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: -4,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: -Spacing.xs / 2,
  },
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  viewAllButton: {
    paddingTop: Spacing.md,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  warningBanner: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
