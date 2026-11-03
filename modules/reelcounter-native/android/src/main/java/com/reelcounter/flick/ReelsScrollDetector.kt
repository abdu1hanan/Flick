package com.reelcounter.flick

import android.os.SystemClock
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import kotlin.math.abs

enum class ScrollDirection {
    NONE,
    NEXT,
    PREVIOUS
}

/**
 * Robust directional scroll detector for Instagram Reels.
 *
 * Rules:
 * 1. ONLY counts when actively in the Reels viewer / Reels pager.
 * 2. NEVER counts when scrolling the main Instagram Home Feed, Explore grid, Comments, Stories, or DMs.
 * 3. Distinguishes scrolling UP for NEXT reel vs scrolling DOWN for PREVIOUS reel.
 * 4. Rejects micro-jiggles and halfway-holds: requires significant cumulative displacement
 *    (>= MIN_SWIPE_DISPLACEMENT_PX) and limits to at most ONE reel commit per touch gesture.
 * 5. Uses active reel signature checks to prevent false counts on snap-backs.
 * 6. Lockout cooldown between consecutive reels.
 */
class ReelsScrollDetector {

    companion object {
        private const val TAG = "ReelsScrollDetector"
        private const val LOCKOUT_MS = 350L
        private const val GESTURE_TIMEOUT_MS = 280L
        private const val MIN_SWIPE_DISPLACEMENT_PX = 200

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
    private var lastScrollEventTime = 0L
    private var accumulatedDeltaY = 0
    private var gestureCommitted = false
    private var lastSeenToIndex = -1
    private var lastSeenScrollY = -1
    private var currentSurface = ""
    private var lastCommittedSignature = ""

    fun updateCurrentSurface(className: String?, text: String?) {
        val s = (className ?: "") + " " + (text ?: "")
        currentSurface = s.lowercase()
    }

    fun detectScrollDirection(event: AccessibilityEvent): ScrollDirection {
        // 1. Reject if this is the Home Feed
        if (isHomeFeed(event)) {
            return ScrollDirection.NONE
        }

        // 2. Reject known non-reels surfaces (comments, DM, profile, stories)
        if (isNonReelsSurface(event)) {
            return ScrollDirection.NONE
        }

        // 3. Must have strong Reels signal
        if (!isReelSurface(event)) {
            return ScrollDirection.NONE
        }

        // 4. Reject horizontal scrolls (Stories, Carousel posts, tab switches)
        val deltaX = event.scrollDeltaX
        val deltaY = event.scrollDeltaY

        if (abs(deltaX) > abs(deltaY) && abs(deltaX) > 10) {
            return ScrollDirection.NONE
        }

        val now = SystemClock.elapsedRealtime()

        // Manage gesture timeout: if events paused > GESTURE_TIMEOUT_MS, user lifted finger / gesture settled
        if (now - lastScrollEventTime > GESTURE_TIMEOUT_MS) {
            accumulatedDeltaY = 0
            gestureCommitted = false
        }
        lastScrollEventTime = now

        // Check ViewPager / RecyclerView page index change
        val toIndex = event.toIndex
        if (toIndex != -1 && lastSeenToIndex != -1 && toIndex != lastSeenToIndex) {
            val isNext = toIndex > lastSeenToIndex
            lastSeenToIndex = toIndex
            if (now - lastCommitTime >= LOCKOUT_MS) {
                lastCommitTime = now
                gestureCommitted = true
                accumulatedDeltaY = 0
                return if (isNext) ScrollDirection.NEXT else ScrollDirection.PREVIOUS
            }
        }
        if (toIndex != -1) {
            lastSeenToIndex = toIndex
        }

        // Accumulate displacement for the active gesture
        accumulatedDeltaY += deltaY

        // If this gesture has already committed a reel, do not commit again until settled
        if (gestureCommitted) {
            return ScrollDirection.NONE
        }

        // Check if cumulative gesture has exceeded the real swipe displacement threshold
        var candidateDirection = ScrollDirection.NONE
        if (accumulatedDeltaY >= MIN_SWIPE_DISPLACEMENT_PX) {
            candidateDirection = ScrollDirection.NEXT
        } else if (accumulatedDeltaY <= -MIN_SWIPE_DISPLACEMENT_PX) {
            candidateDirection = ScrollDirection.PREVIOUS
        }

        // Fallback: large single-event scrollY jump
        val scrollY = event.scrollY
        if (candidateDirection == ScrollDirection.NONE && scrollY != -1 && lastSeenScrollY != -1 && scrollY != lastSeenScrollY) {
            val diff = scrollY - lastSeenScrollY
            if (diff > 120) {
                candidateDirection = ScrollDirection.NEXT
            } else if (diff < -120) {
                candidateDirection = ScrollDirection.PREVIOUS
            }
        }
        if (scrollY != -1) {
            lastSeenScrollY = scrollY
        }

        if (candidateDirection == ScrollDirection.NONE) {
            return ScrollDirection.NONE
        }

        // Lockout check
        if (now - lastCommitTime < LOCKOUT_MS) {
            return ScrollDirection.NONE
        }

        // Reel signature verification (if available) to ensure reel actually changed
        val currentSig = extractReelSignature(event)
        if (currentSig.isNotEmpty() && currentSig == lastCommittedSignature) {
            // Still on the same reel, false trigger or jiggle
            return ScrollDirection.NONE
        }

        // Commit candidate scroll
        lastCommitTime = now
        gestureCommitted = true
        if (currentSig.isNotEmpty()) {
            lastCommittedSignature = currentSig
        }
        accumulatedDeltaY = 0

        return candidateDirection
    }

    private fun extractReelSignature(event: AccessibilityEvent): String {
        val node = try { event.source } catch (e: Exception) { null } ?: return ""
        val sb = StringBuilder()
        collectSignatureText(node, sb, 0)
        return sb.toString().trim()
    }

    private fun collectSignatureText(node: AccessibilityNodeInfo, sb: StringBuilder, depth: Int) {
        if (depth > 3 || sb.length > 80) return
        val text = node.text?.toString()?.trim()
        val desc = node.contentDescription?.toString()?.trim()
        val id = try { node.viewIdResourceName ?: "" } catch (e: Exception) { "" }

        if (!text.isNullOrEmpty() && (id.contains("author") || id.contains("user") || id.contains("profile") || text.startsWith("@"))) {
            sb.append(text).append(":")
        } else if (!desc.isNullOrEmpty() && (id.contains("sound") || id.contains("audio") || desc.contains("audio"))) {
            sb.append(desc).append(":")
        }

        val childCount = try { node.childCount } catch (e: Exception) { 0 }
        for (i in 0 until childCount) {
            val child = try { node.getChild(i) } catch (e: Exception) { null } ?: continue
            collectSignatureText(child, sb, depth + 1)
        }
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
        lastScrollEventTime = 0L
        accumulatedDeltaY = 0
        gestureCommitted = false
        lastSeenToIndex = -1
        lastSeenScrollY = -1
        currentSurface = ""
        lastCommittedSignature = ""
    }
}
