package com.reelcounter.flick

import android.os.SystemClock
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import kotlin.math.abs

/**
 * Robust directional scroll detector for Instagram Reels.
 *
 * Rules:
 * 1. ONLY counts when scrolling UP to watch the NEXT reel (finger moves bottom to top, content moves down: deltaY > 0).
 * 2. NEVER counts when scrolling DOWN to watch an OLD reel (finger moves top to bottom: deltaY < 0).
 * 3. NEVER counts horizontal scrolls (Stories, Carousels, Direct tabs: abs(deltaX) > abs(deltaY)).
 * 4. NEVER counts non-reels surfaces (Comments, Direct chat, Profile, Stories).
 * 5. Uses a 380ms debounce lockout to prevent duplicate events from a single swipe gesture.
 */
class ReelsScrollDetector {

    companion object {
        private const val TAG = "ReelsScrollDetector"
        private const val LOCKOUT_MS = 380L
        private val NON_REELS_KEYWORDS = listOf(
            "comment", "direct", "thread", "message", "chat",
            "story", "profile", "setting", "search", "explore_grid"
        )
    }

    private var lastCommitTime = 0L
    private var lastSeenToIndex = -1
    private var lastSeenScrollY = -1
    private var currentSurface = ""

    fun updateCurrentSurface(className: String?, text: String?) {
        val s = (className ?: "") + " " + (text ?: "")
        currentSurface = s.lowercase()
    }

    fun isNextReelScroll(event: AccessibilityEvent): Boolean {
        // 1. Check if surface is a known non-reel surface (comments, DM chat, stories)
        val eventClass = event.className?.toString()?.lowercase() ?: ""
        val sourceViewId = try {
            event.source?.viewIdResourceName?.lowercase() ?: ""
        } catch (e: Exception) {
            ""
        }

        for (kw in NON_REELS_KEYWORDS) {
            if (eventClass.contains(kw) || sourceViewId.contains(kw) || currentSurface.contains(kw)) {
                return false
            }
        }

        // 2. Reject horizontal scrolls (Stories, Carousel posts, tab switches)
        val deltaX = event.scrollDeltaX
        val deltaY = event.scrollDeltaY

        if (abs(deltaX) > abs(deltaY) && abs(deltaX) > 10) {
            return false
        }

        // 3. Determine scroll direction
        var isForward = false
        var isBackward = false

        if (abs(deltaY) > 5) {
            // High confidence scrollDeltaY from OS
            // Swiping UP to see NEXT reel produces deltaY > 0
            if (deltaY > 0) {
                isForward = true
            } else {
                isBackward = true
            }
        } else {
            // Fallback 1: ViewPager item index
            val toIndex = event.toIndex
            if (toIndex != -1 && lastSeenToIndex != -1 && toIndex != lastSeenToIndex) {
                if (toIndex > lastSeenToIndex) {
                    isForward = true
                } else {
                    isBackward = true
                }
            }
            if (toIndex != -1) {
                lastSeenToIndex = toIndex
            }

            // Fallback 2: ScrollY position
            val scrollY = event.scrollY
            if (!isForward && !isBackward && scrollY != -1 && lastSeenScrollY != -1 && scrollY != lastSeenScrollY) {
                val diff = scrollY - lastSeenScrollY
                if (diff > 30) {
                    isForward = true
                } else if (diff < -30) {
                    isBackward = true
                }
            }
            if (scrollY != -1) {
                lastSeenScrollY = scrollY
            }
        }

        // If user is scrolling down to watch an old reel, NEVER count
        if (isBackward) {
            return false
        }

        if (!isForward) {
            return false
        }

        // 4. Debounce lockout check
        val now = SystemClock.elapsedRealtime()
        if (now - lastCommitTime < LOCKOUT_MS) {
            return false
        }

        lastCommitTime = now
        return true
    }

    fun reset() {
        lastCommitTime = 0L
        lastSeenToIndex = -1
        lastSeenScrollY = -1
        currentSurface = ""
    }
}
