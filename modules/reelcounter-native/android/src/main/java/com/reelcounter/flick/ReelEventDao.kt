package com.reelcounter.flick

data class DailySummary(val localDate: String, val count: Int)

interface ReelEventDao {
    suspend fun insert(event: ReelEvent): Long
    suspend fun getCountForDate(date: String): Int
    suspend fun getDailySummary(limit: Int): List<DailySummary>
    suspend fun getTotalSinceDate(startDate: String): Int
    suspend fun getAllTimeTotal(): Int
    suspend fun deleteAll()
}
