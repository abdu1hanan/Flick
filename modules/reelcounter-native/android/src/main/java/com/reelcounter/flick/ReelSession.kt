package com.reelcounter.flick

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "reel_sessions")
data class ReelSession(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val startTime: Long,                   // epoch millis
    val endTime: Long? = null,             // null while active
    val localStartDate: String,            // "YYYY-MM-DD"
    val reelCount: Int = 0,
    val endReason: String? = null          // "USER_LEFT", "BACKGROUNDED", "PROCESS_DEATH", "SERVICE_DISABLED"
)
