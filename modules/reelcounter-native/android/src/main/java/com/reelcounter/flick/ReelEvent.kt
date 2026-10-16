package com.reelcounter.flick

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "reel_events",
    foreignKeys = [ForeignKey(
        entity = ReelSession::class,
        parentColumns = ["id"],
        childColumns = ["sessionId"],
        onDelete = ForeignKey.CASCADE
    )],
    indices = [Index("sessionId"), Index("localDate")]
)
data class ReelEvent(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val sessionId: Long,
    val timestamp: Long,               // epoch millis
    val localDate: String,             // "YYYY-MM-DD"
    val detectionSource: String        // "SCROLL_DELTA", "CONTENT_DESC_CHANGE", "FOCUS_CHANGE", "COMBINED"
)
