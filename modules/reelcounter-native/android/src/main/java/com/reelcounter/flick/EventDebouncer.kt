package com.reelcounter.flick

import android.os.SystemClock

/**
 * Debounces reel navigation events.
 * After a count is committed, ignores further events for LOCKOUT_MS.
 */
class EventDebouncer(private val lockoutMs: Long = 1200L) {

    private var lastCountTime = 0L

    /**
     * Returns true if enough time has passed since the last committed count.
     * Automatically records the new timestamp if returning true.
     */
    fun shouldCount(): Boolean {
        val now = SystemClock.elapsedRealtime()
        return if (now - lastCountTime >= lockoutMs) {
            lastCountTime = now
            true
        } else {
            false
        }
    }

    fun reset() {
        lastCountTime = 0L
    }
}
