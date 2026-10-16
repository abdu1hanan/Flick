package com.reelcounter.flick

import kotlinx.coroutines.flow.Flow

interface ReelSessionDao {
    suspend fun insert(session: ReelSession): Long
    suspend fun incrementCount(id: Long)
    suspend fun finalize(id: Long, endTime: Long, reason: String)
    suspend fun getOrphanedSessions(): List<ReelSession>
    fun getSessionsForDate(date: String): Flow<List<ReelSession>>
    suspend fun getTotalCompletedSessions(): Int
    suspend fun getLongestSessionCount(): Int?
    suspend fun getAverageReelsPerSession(): Float?
    suspend fun getSessionsCountForDate(date: String): Int
    suspend fun deleteAll()
}
