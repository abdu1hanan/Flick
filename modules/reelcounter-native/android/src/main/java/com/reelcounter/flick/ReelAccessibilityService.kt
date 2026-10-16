package com.reelcounter.flick

import android.accessibilityservice.AccessibilityService
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
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
 * Responsibilities:
 * 1. Shows the pill overlay ONLY when Instagram is in the foreground.
 * 2. Hides the overlay immediately when user leaves Instagram (Home, Recents, other apps, screen off).
 * 3. Resets session count from 0 every time Instagram is closed/reopened.
 * 4. Only counts when scrolling UP to the NEXT reel (ignores scrolling down to old reels).
 * 5. Reliably registers every reel scroll without skipping ads or fast gestures.
 */
class ReelAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "ReelAccessibilityService"
        var instance: ReelAccessibilityService? = null
            private set
    }

    private val serviceScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private lateinit var sessionManager: SessionManager
    private lateinit var overlayManager: OverlayManager
    private val reelsScrollDetector = ReelsScrollDetector()
    private var overlayEnabled = true
    private var isInstagramForeground = false

    private val screenReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == Intent.ACTION_SCREEN_OFF) {
                Log.d(TAG, "Screen turned off: exiting Instagram session")
                handleInstagramExited()
            }
        }
    }

    override fun onServiceConnected() {
        instance = this
        Log.d(TAG, "AccessibilityService connected")

        overlayManager = OverlayManager(this)

        sessionManager = SessionManager(
            context = this,
            scope = serviceScope,
            onCountUpdate = { sessionCount, todayCount ->
                overlayManager.updateCount(sessionCount)
                WidgetUpdater.update(this@ReelAccessibilityService)
                ReelCounterModule.emitReelCounted(sessionCount, todayCount)
            }
        )

        // Register screen receiver to hide overlay when screen turns off
        try {
            val filter = IntentFilter(Intent.ACTION_SCREEN_OFF)
            registerReceiver(screenReceiver, filter)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to register screenReceiver", e)
        }

        // Recover any orphaned sessions from previous process death
        serviceScope.launch(Dispatchers.IO) {
            sessionManager.recoverOrphanedSessions()
        }

        // Read user overlay preference
        serviceScope.launch(Dispatchers.IO) {
            PreferencesRepository(this@ReelAccessibilityService)
                .overlayEnabled.collect { enabled ->
                    overlayEnabled = enabled
                    if (!enabled) {
                        overlayManager.hide()
                    } else if (isInstagramForeground) {
                        overlayManager.show(sessionManager.currentSessionCount)
                    }
                }
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        val pkg = event.packageName?.toString() ?: return

        // 1. Handle app transitions (Instagram foreground vs background)
        if (pkg != "com.instagram.android") {
            // A non-Instagram window gained focus (Launcher, Recents, other apps)
            if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED ||
                event.eventType == AccessibilityEvent.TYPE_WINDOWS_CHANGED) {
                if (isInstagramForeground) {
                    Log.d(TAG, "Left Instagram for $pkg: hiding overlay and resetting session")
                    handleInstagramExited()
                }
            }
            return
        }

        // 2. Below this point, event is inside com.instagram.android
        if (!isInstagramForeground) {
            Log.d(TAG, "Entered Instagram: showing overlay and starting fresh session")
            handleInstagramEntered()
        }

        // 3. Update current surface (detect if in comments, DMs, etc.)
        val className = event.className?.toString()
        val eventTexts = event.text?.joinToString(" ")
        reelsScrollDetector.updateCurrentSurface(className, eventTexts)

        // 4. Process reel scrolling (TYPE_VIEW_SCROLLED)
        if (event.eventType == AccessibilityEvent.TYPE_VIEW_SCROLLED) {
            if (reelsScrollDetector.isNextReelScroll(event)) {
                Log.d(TAG, "Next reel scroll registered: incrementing count")
                serviceScope.launch {
                    sessionManager.incrementCount()
                }
            }
        }
    }

    private fun handleInstagramEntered() {
        isInstagramForeground = true
        reelsScrollDetector.reset()
        sessionManager.startSession { initialCount ->
            if (overlayEnabled) {
                overlayManager.show(initialCount)
            }
        }
    }

    private fun handleInstagramExited() {
        if (!isInstagramForeground) return
        isInstagramForeground = false
        overlayManager.hide()
        reelsScrollDetector.reset()
        sessionManager.endSession(EndReason.BACKGROUNDED)
    }

    override fun onInterrupt() {
        Log.d(TAG, "Service interrupted")
        handleInstagramExited()
    }

    override fun onDestroy() {
        Log.d(TAG, "Service destroyed")
        instance = null
        try {
            unregisterReceiver(screenReceiver)
        } catch (e: Exception) {
            // Ignore
        }
        handleInstagramExited()
        serviceScope.cancel()
        super.onDestroy()
    }

    /** Called by ReelCounterModule when overlay preference changes. */
    fun setOverlayEnabled(enabled: Boolean) {
        overlayEnabled = enabled
        if (!enabled) {
            overlayManager.hide()
        } else if (isInstagramForeground) {
            overlayManager.show(sessionManager.currentSessionCount)
        }
    }
}
