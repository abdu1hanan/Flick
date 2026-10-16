package com.reelcounter.flick

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface ReelSessionDao {
    @Insert
    suspend fun insert(session: ReelSession): Long

    @Query("UPDATE reel_sessions SET reelCount = reelCount + 1 WHERE id = :id")
    suspend fun incrementCount(id: Long)

    @Query("UPDATE reel_sessions SET endTime = :endTime, endReason = :reason WHERE id = :id")
    suspend fun finalize(id: Long, endTime: Long, reason: String)

    @Query("SELECT * FROM reel_sessions WHERE endTime IS NULL")
    suspend fun getOrphanedSessions(): List<ReelSession>

    @Query("SELECT * FROM reel_sessions WHERE localStartDate = :date ORDER BY startTime DESC")
    fun getSessionsForDate(date: String): Flow<List<ReelSession>>

    @Query("SELECT COUNT(*) FROM reel_sessions WHERE reelCount > 0")
    suspend fun getTotalCompletedSessions(): Int

    @Query("SELECT MAX(reelCount) FROM reel_sessions")
    suspend fun getLongestSessionCount(): Int?

    @Query("SELECT AVG(CAST(reelCount AS REAL)) FROM reel_sessions WHERE reelCount > 0")
    suspend fun getAverageReelsPerSession(): Float?

    @Query("SELECT COUNT(*) FROM reel_sessions WHERE localStartDate = :date AND reelCount > 0")
    suspend fun getSessionsCountForDate(date: String): Int

    @Query("DELETE FROM reel_sessions")
    suspend fun deleteAll()
}
