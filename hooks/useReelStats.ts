import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import ReelCounter from '../modules/reelcounter-native/src';
import type { ReelStats } from '../types';

const EMPTY_STATS: ReelStats = {
  todayCount: 0,
  yesterdayCount: 0,
  last7DaysTotal: 0,
  allTimeTotal: 0,
  dailySummary: [],
  sessionStats: {
    totalSessions: 0,
    sessionsToday: 0,
    avgReelsPerSession: 0,
    longestSessionCount: 0,
    avgDailyReels: 0,
  },
};

export function useReelStats() {
  const [stats, setStats] = useState<ReelStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const [todayCount, yesterdayCount, last7DaysTotal, allTimeTotal, dailySummary, sessionStats] =
        await Promise.all([
          ReelCounter.getTodayCount(),
          ReelCounter.getYesterdayCount(),
          ReelCounter.getLast7DaysTotal(),
          ReelCounter.getAllTimeTotal(),
          ReelCounter.getDailySummary(90), // 90 days of history
          ReelCounter.getSessionStats(),
        ]);

      setStats({
        todayCount,
        yesterdayCount,
        last7DaysTotal,
        allTimeTotal,
        dailySummary,
        sessionStats,
      });
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh when app comes to foreground
  useEffect(() => {
    fetchStats();
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') fetchStats();
    });
    return () => subscription.remove();
  }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
}
