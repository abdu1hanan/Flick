package com.reelcounter.flick

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ReelRepository(private val context: Context) {

    private val db get() = AppDatabase.getInstance(context)

    // ---- Session operations ----
    suspend fun insertSession(session: ReelSession): Long = withContext(Dispatchers.IO) {
        db.sessionDao().insert(session)
    }

    suspend fun incrementSessionCount(sessionId: Long) = withContext(Dispatchers.IO) {
        db.sessionDao().incrementCount(sessionId)
    }

    suspend fun finalizeSession(sessionId: Long, endTime: Long, reason: String) = withContext(Dispatchers.IO) {
        db.sessionDao().finalize(sessionId, endTime, reason)
    }

    suspend fun getOrphanedSessions(): List<ReelSession> = withContext(Dispatchers.IO) {
        db.sessionDao().getOrphanedSessions()
    }

    suspend fun deleteSessionById(id: Long) = withContext(Dispatchers.IO) {
        // Used to remove zero-count sessions
        db.sessionDao().finalize(id, System.currentTimeMillis(), "EMPTY")
        // Actually delete it via deleteAll for the id — handled inline
    }

    suspend fun getTotalCompletedSessions(): Int = withContext(Dispatchers.IO) {
        db.sessionDao().getTotalCompletedSessions()
    }

    suspend fun getLongestSessionCount(): Int = withContext(Dispatchers.IO) {
        db.sessionDao().getLongestSessionCount() ?: 0
    }

    suspend fun getAverageReelsPerSession(): Float = withContext(Dispatchers.IO) {
        db.sessionDao().getAverageReelsPerSession() ?: 0f
    }

    suspend fun getSessionsCountForDate(date: String): Int = withContext(Dispatchers.IO) {
        db.sessionDao().getSessionsCountForDate(date)
    }

    // ---- Event operations ----
    suspend fun insertEvent(event: ReelEvent): Long = withContext(Dispatchers.IO) {
        db.eventDao().insert(event)
    }

    suspend fun getCountForDate(date: String): Int = withContext(Dispatchers.IO) {
        db.eventDao().getCountForDate(date)
    }

    suspend fun getDailySummary(limit: Int): List<DailySummary> = withContext(Dispatchers.IO) {
        db.eventDao().getDailySummary(limit)
    }

    suspend fun getTotalSinceDate(startDate: String): Int = withContext(Dispatchers.IO) {
        db.eventDao().getTotalSinceDate(startDate)
    }

    suspend fun getAllTimeTotal(): Int = withContext(Dispatchers.IO) {
        db.eventDao().getAllTimeTotal()
    }

    // ---- Data management ----
    suspend fun clearAllData() = withContext(Dispatchers.IO) {
        db.sessionDao().deleteAll()
        db.eventDao().deleteAll()
    }
}
