package com.reelcounter.flick

data class ReelEvent(
    val id: Long = 0,
    val sessionId: Long,
    val timestamp: Long,               // epoch millis
    val localDate: String,             // "YYYY-MM-DD"
    val detectionSource: String        // "SCROLL_DELTA", "CONTENT_DESC_CHANGE", "FOCUS_CHANGE", "COMBINED"
)
