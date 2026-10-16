package com.reelcounter.flick

import android.os.SystemClock
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * Detects reel navigation events within an active Reels session.
 *
 * A reel navigation is committed when:
 * - Signal A (scroll on Reels view) AND (Signal B OR Signal C) within SIGNAL_WINDOW_MS, OR
 * - Signal B alone (content description change) is detected with a changed description.
 *
 * After a count, LOCKOUT_MS prevents re-counting from the same gesture's event burst.
 */
class NavigationDetector {

    companion object {
        val NAV_VIEW_ID_SUBSTRINGS = listOf("clips", "reel", "video", "carousel")
        const val LOCKOUT_MS = 1200L
        const val SIGNAL_WINDOW_MS = 600L
    }

    private val debouncer = EventDebouncer(LOCKOUT_MS)

    // State for signal window correlation
    private var signalATime = 0L
    private var signalBTime = 0L
    private var signalCTime = 0L
    private var lastContentDesc = ""

    /**
     * Process an accessibility event and return true if a reel navigation is detected.
     */
    fun process(event: AccessibilityEvent): Boolean {
        val now = SystemClock.elapsedRealtime()

        return when (event.eventType) {
            AccessibilityEvent.TYPE_VIEW_SCROLLED -> {
                if (isReelScrollEvent(event)) {
                    signalATime = now
                    checkCommit(now)
                } else false
            }
            AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED -> {
                val newDesc = getContentDescFromEvent(event)
                if (newDesc.isNotEmpty() && newDesc != lastContentDesc) {
                    lastContentDesc = newDesc
                    signalBTime = now
                    checkCommit(now)
                } else false
            }
            AccessibilityEvent.TYPE_VIEW_FOCUSED -> {
                if (isVideoPlayerNode(event)) {
                    signalCTime = now
                    checkCommit(now)
                } else false
            }
            else -> false
        }
    }

    private fun checkCommit(now: Long): Boolean {
        // Signal A + (B or C) within window
        val aRecent = (now - signalATime) < SIGNAL_WINDOW_MS
        val bRecent = (now - signalBTime) < SIGNAL_WINDOW_MS
        val cRecent = (now - signalCTime) < SIGNAL_WINDOW_MS

        val shouldCommit = (aRecent && (bRecent || cRecent)) || bRecent

        return if (shouldCommit && debouncer.shouldCount()) {
            // Reset signal times to avoid re-triggering
            signalATime = 0L
            signalBTime = 0L
            signalCTime = 0L
            true
        } else {
            false
        }
    }

    private fun isReelScrollEvent(event: AccessibilityEvent): Boolean {
        val viewId = event.source?.viewIdResourceName ?: ""
        return NAV_VIEW_ID_SUBSTRINGS.any { viewId.contains(it, ignoreCase = true) }
    }

    private fun getContentDescFromEvent(event: AccessibilityEvent): String {
        val node = event.source ?: return ""
        val desc = findVideoContentDesc(node, 0)
        node.recycle()
        return desc
    }

    private fun findVideoContentDesc(node: AccessibilityNodeInfo, depth: Int): String {
        if (depth > 2) return ""
        val viewId = node.viewIdResourceName ?: ""
        if (NAV_VIEW_ID_SUBSTRINGS.any { viewId.contains(it, ignoreCase = true) }) {
            val desc = node.contentDescription?.toString() ?: ""
            if (desc.isNotEmpty()) return desc
        }
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val result = findVideoContentDesc(child, depth + 1)
            child.recycle()
            if (result.isNotEmpty()) return result
        }
        return ""
    }

    private fun isVideoPlayerNode(event: AccessibilityEvent): Boolean {
        val viewId = event.source?.viewIdResourceName ?: ""
        return NAV_VIEW_ID_SUBSTRINGS.any { viewId.contains(it, ignoreCase = true) }
    }

    fun reset() {
        debouncer.reset()
        signalATime = 0L
        signalBTime = 0L
        signalCTime = 0L
        lastContentDesc = ""
    }
}
