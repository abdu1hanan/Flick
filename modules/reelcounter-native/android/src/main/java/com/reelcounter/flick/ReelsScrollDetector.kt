package com.reelcounter.flick

import android.os.SystemClock
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import kotlin.math.abs

/**
 * Robust directional scroll detector for Instagram Reels.
 *
 * Rules:
 * 1. ONLY counts when actively in the Reels viewer / Reels pager.
 * 2. NEVER counts when scrolling the main Instagram Home Feed, Explore grid, Comments, Stories, or DMs.
 * 3. ONLY counts when scrolling UP to watch the NEXT reel (finger moves bottom to top, content moves down: deltaY > 0).
 * 4. NEVER counts when scrolling DOWN to watch an OLD reel (finger moves top to bottom: deltaY < 0).
 * 5. NEVER counts horizontal scrolls (Stories, Carousels, Direct tabs: abs(deltaX) > abs(deltaY)).
 * 6. Uses a 380ms debounce lockout to prevent duplicate events from a single swipe gesture.
 */
class ReelsScrollDetector {

    companion object {
        private const val TAG = "ReelsScrollDetector"
        private const val LOCKOUT_MS = 380L

        private val REELS_KEYWORDS = listOf(
            "clips", "reel", "video_player", "video_cell", "clips_viewer",
            "clips_pager", "clips_video", "reel_viewer", "clips_media"
        )

        private val NON_REELS_KEYWORDS = listOf(
            "comment", "direct", "thread", "message", "chat",
            "story", "profile", "setting", "search", "explore_grid"
        )

        private val HOME_FEED_KEYWORDS = listOf(
            "main_feed", "feed_recycler", "row_feed", "newsfeed", "feed_composer",
            "action_bar_title_logo", "sticky_header", "feed_tab"
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
        // 1. Reject if this is the Home Feed
        if (isHomeFeed(event)) {
            return false
        }

        // 2. Reject known non-reels surfaces (comments, DM, profile, stories)
        if (isNonReelsSurface(event)) {
            return false
        }

        // 3. Must have strong Reels signal
        if (!isReelSurface(event)) {
            return false
        }

        // 4. Reject horizontal scrolls (Stories, Carousel posts, tab switches)
        val deltaX = event.scrollDeltaX
        val deltaY = event.scrollDeltaY

        if (abs(deltaX) > abs(deltaY) && abs(deltaX) > 10) {
            return false
        }

        // 5. Determine scroll direction
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

        // 6. Debounce lockout check
        val now = SystemClock.elapsedRealtime()
        if (now - lastCommitTime < LOCKOUT_MS) {
            return false
        }

        lastCommitTime = now
        return true
    }

    private fun isHomeFeed(event: AccessibilityEvent): Boolean {
        val eventClass = event.className?.toString()?.lowercase() ?: ""
        val sourceNode = try { event.source } catch (e: Exception) { null }
        val sourceId = try { sourceNode?.viewIdResourceName?.lowercase() ?: "" } catch (e: Exception) { "" }

        // If source or surface specifically matches Home Feed
        for (kw in HOME_FEED_KEYWORDS) {
            if (sourceId.contains(kw) || eventClass.contains(kw) || currentSurface.contains(kw)) {
                // If it also contains clips, it might be a clips viewer embedded inside, otherwise it's feed
                if (!sourceId.contains("clips") && !currentSurface.contains("clips")) {
                    return true
                }
            }
        }

        // Check ancestors for feed
        var current = sourceNode
        var depth = 0
        while (current != null && depth < 3) {
            val parent = try { current.parent } catch (e: Exception) { null }
            val parentId = try { parent?.viewIdResourceName?.lowercase() ?: "" } catch (e: Exception) { "" }
            for (kw in HOME_FEED_KEYWORDS) {
                if (parentId.contains(kw) && !parentId.contains("clips")) {
                    return true
                }
            }
            current = parent
            depth++
        }

        return false
    }

    private fun isNonReelsSurface(event: AccessibilityEvent): Boolean {
        val eventClass = event.className?.toString()?.lowercase() ?: ""
        val sourceNode = try { event.source } catch (e: Exception) { null }
        val sourceId = try { sourceNode?.viewIdResourceName?.lowercase() ?: "" } catch (e: Exception) { "" }

        for (kw in NON_REELS_KEYWORDS) {
            if (eventClass.contains(kw) || sourceId.contains(kw) || currentSurface.contains(kw)) {
                return true
            }
        }
        return false
    }

    private fun isReelSurface(event: AccessibilityEvent): Boolean {
        val eventClass = event.className?.toString()?.lowercase() ?: ""
        val sourceNode = try { event.source } catch (e: Exception) { null }
        val sourceId = try { sourceNode?.viewIdResourceName?.lowercase() ?: "" } catch (e: Exception) { "" }

        // 1. Direct keywords on source or surface
        for (kw in REELS_KEYWORDS) {
            if (sourceId.contains(kw) || eventClass.contains(kw) || currentSurface.contains(kw)) {
                return true
            }
        }

        // 2. Text / content descriptions
        val desc = event.contentDescription?.toString()?.lowercase() ?: ""
        val text = event.text?.joinToString(" ")?.lowercase() ?: ""
        if (desc.contains("reel") || desc.contains("clip") || text.contains("reel") || text.contains("clips")) {
            return true
        }

        // 3. Inspect ancestor nodes up to 4 levels
        var current = sourceNode
        var depth = 0
        while (current != null && depth < 4) {
            val parent = try { current.parent } catch (e: Exception) { null }
            val parentId = try { parent?.viewIdResourceName?.lowercase() ?: "" } catch (e: Exception) { "" }
            for (kw in REELS_KEYWORDS) {
                if (parentId.contains(kw)) {
                    return true
                }
            }
            current = parent
            depth++
        }

        // 4. Inspect direct children (up to 2 levels)
        if (sourceNode != null && hasChildReelSignal(sourceNode, 0)) {
            return true
        }

        return false
    }

    private fun hasChildReelSignal(node: AccessibilityNodeInfo, depth: Int): Boolean {
        if (depth > 2) return false
        val count = try { node.childCount } catch (e: Exception) { 0 }
        for (i in 0 until count) {
            val child = try { node.getChild(i) } catch (e: Exception) { null } ?: continue
            val id = try { child.viewIdResourceName?.lowercase() ?: "" } catch (e: Exception) { "" }
            val desc = try { child.contentDescription?.toString()?.lowercase() ?: "" } catch (e: Exception) { "" }
            for (kw in REELS_KEYWORDS) {
                if (id.contains(kw) || desc.contains(kw)) {
                    return true
                }
            }
            if (hasChildReelSignal(child, depth + 1)) return true
        }
        return false
    }

    fun reset() {
        lastCommitTime = 0L
        lastSeenToIndex = -1
        lastSeenScrollY = -1
        currentSurface = ""
    }
}
