package com.reelcounter.flick

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

/**
 * Main AccessibilityService entry point.
 *
 * Delegates all detection to InstagramStateTracker and all persistence
 * to SessionManager. Never performs disk I/O on the main thread.
 *
 * EVENT LOGGING MODE: Set LOG_EVENTS = true to dump all Instagram
 * accessibility events to Logcat for physical-device calibration of
 * heuristics (Phase 3, Task 3.2). Set to false for production.
 */
class ReelAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "ReelCounter"
        private const val LOG_EVENTS = false // Set true for heuristic calibration
        var instance: ReelAccessibilityService? = null
            private set
    }

    private val serviceScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private lateinit var stateTracker: InstagramStateTracker
    private lateinit var sessionManager: SessionManager
    private lateinit var overlayManager: OverlayManager
    private var overlayEnabled = true

    override fun onServiceConnected() {
        instance = this
        Log.d(TAG, "AccessibilityService connected")

        overlayManager = OverlayManager(this)

        sessionManager = SessionManager(
            context = this,
            scope = serviceScope,
            onCountUpdate = { sessionCount, todayCount ->
                // Called from IO thread — dispatch to main for overlay + events
                serviceScope.launch {
                    overlayManager.updateCount(sessionCount)
                    WidgetUpdater.update(this@ReelAccessibilityService)
                    ReelCounterModule.emitReelCounted(sessionCount, todayCount)
                }
            }
        )

        stateTracker = InstagramStateTracker(
            onReelsEntered = {
                Log.d(TAG, "Reels entered — starting session")
                sessionManager.startSession()
                if (overlayEnabled) overlayManager.show(0)
            },
            onReelNavigated = {
                Log.d(TAG, "Reel navigated")
                serviceScope.launch { sessionManager.incrementCount() }
            },
            onReelsExited = {
                Log.d(TAG, "Reels exited")
                sessionManager.scheduleSessionEnd(EndReason.USER_LEFT)
                overlayManager.hide()
            },
            onInstagramClosed = {
                Log.d(TAG, "Instagram closed/backgrounded")
                sessionManager.scheduleSessionEnd(EndReason.BACKGROUNDED)
                overlayManager.hide()
            }
        )

        // Recover any orphaned sessions from a previous process death
        serviceScope.launch(Dispatchers.IO) {
            sessionManager.recoverOrphanedSessions()
        }

        // Read overlay preference
        serviceScope.launch(Dispatchers.IO) {
            PreferencesRepository(this@ReelAccessibilityService)
                .overlayEnabled.collect { enabled ->
                    overlayEnabled = enabled
                    if (!enabled) overlayManager.hide()
                }
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.packageName != "com.instagram.android") return

        if (LOG_EVENTS) {
            Log.d(TAG, "EVENT: type=${AccessibilityEvent.eventTypeToString(event.eventType)} " +
                    "class=${event.className} " +
                    "viewId=${event.source?.viewIdResourceName} " +
                    "text=${event.text} " +
                    "contentDesc=${event.source?.contentDescription}")
        }

        stateTracker.process(event)
    }

    override fun onInterrupt() {
        Log.d(TAG, "Service interrupted")
        serviceScope.launch(Dispatchers.IO) {
            sessionManager.finalizeActiveSession(EndReason.SERVICE_DISABLED)
        }
        overlayManager.hide()
    }

    override fun onDestroy() {
        Log.d(TAG, "Service destroyed")
        instance = null
        serviceScope.launch(Dispatchers.IO) {
            sessionManager.finalizeActiveSession(EndReason.SERVICE_DISABLED)
        }
        overlayManager.hide()
        serviceScope.cancel()
        super.onDestroy()
    }

    /** Called by ReelCounterModule when overlay preference changes. */
    fun setOverlayEnabled(enabled: Boolean) {
        overlayEnabled = enabled
        if (!enabled) overlayManager.hide()
        else if (stateTracker.currentState == InstagramState.REELS_ACTIVE) {
            sessionManager.activeSession?.let { overlayManager.show(it.reelCount) }
        }
    }
}
