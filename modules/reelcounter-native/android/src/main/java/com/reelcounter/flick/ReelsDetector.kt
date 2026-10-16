package com.reelcounter.flick

import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * Detects whether Instagram's Reels viewer is currently active.
 *
 * Uses a multi-signal approach since Instagram does not expose stable reel IDs.
 * Requires at least 2 of 3 positive signals to avoid false positives.
 *
 * NOTE: These heuristics must be validated against real Instagram accessibility events
 * on a physical device (Phase 3, Task 3.2). Adjust REELS_VIEW_ID_SUBSTRINGS and
 * REELS_CONTENT_DESC_SUBSTRINGS based on observed events for your Instagram version.
 */
class ReelsDetector {

    companion object {
        // View IDs that appear in Instagram Reels surface
        val REELS_VIEW_ID_SUBSTRINGS = listOf(
            "clips", "reel", "reel_viewer", "video_player",
            "carousel_media_group", "video_cell"
        )
        // Content descriptions present in Reels
        val REELS_CONTENT_DESC_SUBSTRINGS = listOf(
            "Reel by", "reel by", "Video by", "Clip by",
            "Reels", "reels"
        )
        // Window/class names that appear in Reels
        val REELS_WINDOW_TITLE_SUBSTRINGS = listOf("Reels", "Reel", "Clips")

        // Negative signals — these windows are NOT reels
        val NOT_REELS_CLASS_SUBSTRINGS = listOf(
            "DirectThread", "StoryViewer", "ProfileView",
            "NotificationsFragment", "SearchFragment", "ExploreFragment"
        )
    }

    /**
     * Returns true if the given event strongly indicates the Reels viewer is active.
     */
    fun isReelsViewerEvent(event: AccessibilityEvent): Boolean {
        val className = event.className?.toString() ?: ""
        val packageName = event.packageName?.toString() ?: ""

        // Reject non-Instagram events
        if (packageName != "com.instagram.android") return false

        // Check negative signals first
        for (neg in NOT_REELS_CLASS_SUBSTRINGS) {
            if (className.contains(neg, ignoreCase = true)) return false
        }

        var positiveSignals = 0

        // Signal 1: Window title or event text contains Reels keywords
        val eventTexts = event.text?.joinToString(" ") ?: ""
        for (keyword in REELS_WINDOW_TITLE_SUBSTRINGS) {
            if (eventTexts.contains(keyword, ignoreCase = true) ||
                className.contains(keyword, ignoreCase = true)) {
                positiveSignals++
                break
            }
        }

        // Signal 2: Root node view IDs contain Reels-specific substrings
        val rootNode = event.source
        if (rootNode != null && containsReelViewIds(rootNode)) {
            positiveSignals++
        }

        // Signal 3: Content descriptions on nodes mention Reels
        if (rootNode != null && containsReelContentDesc(rootNode)) {
            positiveSignals++
        }

        rootNode?.recycle()
        return positiveSignals >= 2
    }

    /**
     * Checks if any view IDs in the accessibility tree match Reels patterns.
     * Only inspects 2 levels deep for performance.
     */
    private fun containsReelViewIds(node: AccessibilityNodeInfo, depth: Int = 0): Boolean {
        if (depth > 2) return false
        val viewId = node.viewIdResourceName ?: ""
        for (sub in REELS_VIEW_ID_SUBSTRINGS) {
            if (viewId.contains(sub, ignoreCase = true)) return true
        }
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            if (containsReelViewIds(child, depth + 1)) {
                child.recycle()
                return true
            }
            child.recycle()
        }
        return false
    }

    private fun containsReelContentDesc(node: AccessibilityNodeInfo, depth: Int = 0): Boolean {
        if (depth > 2) return false
        val desc = node.contentDescription?.toString() ?: ""
        for (sub in REELS_CONTENT_DESC_SUBSTRINGS) {
            if (desc.contains(sub, ignoreCase = true)) return true
        }
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            if (containsReelContentDesc(child, depth + 1)) {
                child.recycle()
                return true
            }
            child.recycle()
        }
        return false
    }

    /**
     * Checks if the given window class name is a known non-Reels surface.
     */
    fun isNonReelsSurface(className: String?): Boolean {
        if (className == null) return false
        return NOT_REELS_CLASS_SUBSTRINGS.any { className.contains(it, ignoreCase = true) }
    }
}
