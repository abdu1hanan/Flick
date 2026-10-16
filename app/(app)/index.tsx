import React, { useState, useCallback } from 'react';
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
import { useReelEvent } from '../../hooks/useReelEvent';
import { usePermissions } from '../../hooks/usePermissions';
import { StatCard } from '../../components/StatCard';
import { WeeklyChart } from '../../components/WeeklyChart';
import { SessionStatsCard } from '../../components/SessionStats';
import { DayRow } from '../../components/DayRow';
import { IslandPreview } from '../../components/IslandPreview';
import { EmptyState } from '../../components/EmptyState';
import { Spacing } from '../../constants/spacing';
import { Fonts } from '../../constants/typography';

function todayDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
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

  // Intelligent Android status bar offset
  const topPadding = Math.max(insets.top + 6, 40);

  return (
    <View style={styles.root}>
      {/* Top Header: intelligently spaced for Android phone top status bar (SIM, battery, notch) */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <View style={styles.headerSide} />
        {/* Top Center: App name "flick" in Pixer font */}
        <Text style={styles.headerTitle}>flick</Text>
        <TouchableOpacity
          style={[styles.headerSide, styles.headerRight]}
          onPress={() => router.push('/(app)/settings')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          isEmpty && styles.emptyScrollContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B00"
          />
        }
      >
        {isEmpty ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              showSetup={!permissions.accessibility || !permissions.overlay}
              onSetupPress={() => router.push('/(app)/settings')}
            />
          </View>
        ) : (
          <>
            {/* Hero Card: Minimal, clean, no AI slop */}
            <View style={styles.heroCard}>
              <Text style={styles.heroNumber}>{displayToday}</Text>
              <Text style={styles.heroLabel}>reels today</Text>
              <View style={styles.heroPillContainer}>
                <IslandPreview count={displayToday} />
              </View>
            </View>

            {/* Clean 4-Stat Row */}
            <View style={styles.statsRow}>
              <StatCard label="Today" value={displayToday} accent />
              <StatCard label="Yesterday" value={stats.yesterdayCount} />
              <StatCard label="7 Days" value={stats.last7DaysTotal} />
              <StatCard label="All Time" value={stats.allTimeTotal} />
            </View>

            {/* Weekly Activity Chart */}
            <View style={styles.card}>
              <WeeklyChart data={stats.dailySummary} />
            </View>

            {/* Session Analytics */}
            <SessionStatsCard stats={stats.sessionStats} />

            {/* Recent Days History */}
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>Recent Days</Text>
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
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllText}>View All History &rarr;</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Permission banner if missing */}
            {(!permissions.accessibility || !permissions.overlay) && (
              <TouchableOpacity
                style={styles.warningBanner}
                onPress={() => router.push('/(app)/settings')}
                activeOpacity={0.8}
              >
                <Text style={styles.warningText}>
                  {!permissions.accessibility
                    ? 'Accessibility permission required to count reels'
                    : 'Overlay permission needed for floating island'}
                </Text>
              </TouchableOpacity>
            )}
          </>
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
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
    backgroundColor: '#09090B',
  },
  headerSide: {
    width: 36,
  },
  headerTitle: {
    fontFamily: Fonts.pixel,
    fontSize: 28,
    color: '#FF6B00',
    letterSpacing: 2,
    textAlign: 'center',
  },
  headerRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 18,
    color: '#8E8E96',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacing.xxxl,
  },
  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#202024',
    backgroundColor: '#131316',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNumber: {
    fontFamily: Fonts.manropeExtra,
    fontSize: 78,
    color: '#FF6B00',
    letterSpacing: -3,
    lineHeight: 84,
  },
  heroLabel: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 15,
    color: '#8E8E96',
    letterSpacing: -0.2,
    marginTop: 2,
    marginBottom: Spacing.base,
  },
  heroPillContainer: {
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#202024',
    backgroundColor: '#131316',
    padding: Spacing.base,
  },
  cardSectionTitle: {
    fontFamily: Fonts.manropeSemi,
    fontSize: 11,
    color: '#8E8E96',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
  },
  viewAllButton: {
    paddingTop: Spacing.md,
    alignItems: 'center',
  },
  viewAllText: {
    fontFamily: Fonts.manropeBold,
    fontSize: 13,
    color: '#FF6B00',
    letterSpacing: -0.2,
  },
  warningBanner: {
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
    borderRadius: 14,
    padding: Spacing.md,
    alignItems: 'center',
  },
  warningText: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 12,
    color: '#FF6B00',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
});
