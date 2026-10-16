// Shared TypeScript types for ReelCounter

export interface DailySummary {
  localDate: string; // "YYYY-MM-DD"
  count: number;
}

export interface SessionStats {
  totalSessions: number;
  sessionsToday: number;
  avgReelsPerSession: number;
  longestSessionCount: number;
  avgDailyReels: number; // 7-day rolling
}

export interface PermissionStatus {
  accessibility: boolean;
  overlay: boolean;
}

export interface ReelStats {
  todayCount: number;
  yesterdayCount: number;
  last7DaysTotal: number;
  allTimeTotal: number;
  dailySummary: DailySummary[];
  sessionStats: SessionStats;
}

export interface ReelCountedEvent {
  todayCount: number;
  sessionCount: number;
}
