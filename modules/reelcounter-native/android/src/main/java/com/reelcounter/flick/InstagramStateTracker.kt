package com.reelcounter.flick

import android.view.accessibility.AccessibilityEvent

/**
 * State machine tracking Instagram's navigation state.
 *
 * States:
 *   IDLE → INSTAGRAM_OPEN → REELS_ACTIVE ↔ INSTAGRAM_OPEN → IDLE
 */
enum class InstagramState {
    IDLE,
    INSTAGRAM_OPEN,
    REELS_ACTIVE,
}

class InstagramStateTracker(
    private val onReelsEntered: () -> Unit,
    private val onReelNavigated: () -> Unit,
    private val onReelsExited: () -> Unit,
    private val onInstagramClosed: () -> Unit,
) {
    var currentState = InstagramState.IDLE
        private set

    private val reelsDetector = ReelsDetector()
    private val navDetector = NavigationDetector()

    // Signal accumulation for Reels entry (require 2 of 3 signals in 500ms)
    private var reelsSignalCount = 0
    private var reelsSignalWindowStart = 0L
    private val REELS_SIGNAL_WINDOW_MS = 500L

    fun process(event: AccessibilityEvent) {
        when (event.eventType) {
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> handleWindowStateChanged(event)
            AccessibilityEvent.TYPE_WINDOWS_CHANGED -> handleWindowsChanged(event)
            else -> {
                if (currentState == InstagramState.REELS_ACTIVE) {
                    handleReelsEvent(event)
                } else if (currentState == InstagramState.INSTAGRAM_OPEN) {
                    // Check if we've transitioned to reels
                    checkForReelsEntry(event)
                }
            }
        }
    }

    private fun handleWindowStateChanged(event: AccessibilityEvent) {
        val pkg = event.packageName?.toString() ?: ""
        val className = event.className?.toString() ?: ""

        if (pkg != "com.instagram.android") {
            // Instagram left foreground
            if (currentState != InstagramState.IDLE) {
                transitionToInstagramClosed()
            }
            return
        }

        // Instagram is in foreground
        when (currentState) {
            InstagramState.IDLE -> {
                currentState = InstagramState.INSTAGRAM_OPEN
                // Check if we entered Reels directly
                checkForReelsEntry(event)
            }
            InstagramState.INSTAGRAM_OPEN -> checkForReelsEntry(event)
            InstagramState.REELS_ACTIVE -> {
                // Check if we navigated away from Reels
                if (reelsDetector.isNonReelsSurface(className)) {
                    transitionToInstagramOpen()
                }
            }
        }
    }

    private fun handleWindowsChanged(event: AccessibilityEvent) {
        // If Instagram is no longer in any window, treat as closed
        val pkg = event.packageName?.toString() ?: ""
        if (pkg.isEmpty() || (pkg != "com.instagram.android" && currentState != InstagramState.IDLE)) {
            // May indicate Instagram closed; handled conservatively by grace period in SessionManager
        }
    }

    private fun checkForReelsEntry(event: AccessibilityEvent) {
        if (reelsDetector.isReelsViewerEvent(event)) {
            accumulateReelsSignal()
        }
    }

    private fun accumulateReelsSignal() {
        val now = android.os.SystemClock.elapsedRealtime()
        if (now - reelsSignalWindowStart > REELS_SIGNAL_WINDOW_MS) {
            // Reset window
            reelsSignalCount = 0
            reelsSignalWindowStart = now
        }
        reelsSignalCount++
        if (reelsSignalCount >= 2) {
            reelsSignalCount = 0
            transitionToReelsActive()
        }
    }

    private fun handleReelsEvent(event: AccessibilityEvent) {
        // Check if we navigated away from Reels
        val className = event.className?.toString() ?: ""
        if (reelsDetector.isNonReelsSurface(className)) {
            transitionToInstagramOpen()
            return
        }
        // Check for reel navigation
        if (navDetector.process(event)) {
            onReelNavigated()
        }
    }

    private fun transitionToReelsActive() {
        if (currentState == InstagramState.REELS_ACTIVE) return
        currentState = InstagramState.REELS_ACTIVE
        navDetector.reset()
        onReelsEntered()
    }

    private fun transitionToInstagramOpen() {
        if (currentState == InstagramState.INSTAGRAM_OPEN) return
        val wasReels = currentState == InstagramState.REELS_ACTIVE
        currentState = InstagramState.INSTAGRAM_OPEN
        if (wasReels) onReelsExited()
    }

    private fun transitionToInstagramClosed() {
        val wasReels = currentState == InstagramState.REELS_ACTIVE
        currentState = InstagramState.IDLE
        if (wasReels) onReelsExited()
        onInstagramClosed()
    }
}
