package com.reelcounter.flick

import androidx.room.*

data class DailySummary(val localDate: String, val count: Int)

@Dao
interface ReelEventDao {
    @Insert
    suspend fun insert(event: ReelEvent): Long

    @Query("SELECT COUNT(*) FROM reel_events WHERE localDate = :date")
    suspend fun getCountForDate(date: String): Int

    @Query("""
        SELECT localDate, COUNT(*) as count 
        FROM reel_events 
        GROUP BY localDate 
        ORDER BY localDate DESC 
        LIMIT :limit
    """)
    suspend fun getDailySummary(limit: Int): List<DailySummary>

    @Query("SELECT COUNT(*) FROM reel_events WHERE localDate >= :startDate")
    suspend fun getTotalSinceDate(startDate: String): Int

    @Query("SELECT COUNT(*) FROM reel_events")
    suspend fun getAllTimeTotal(): Int

    @Query("DELETE FROM reel_events")
    suspend fun deleteAll()
}
