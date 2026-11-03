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
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Main AccessibilityService entry point for Flick.
 *
 * Responsibilities:
 * 1. Shows the pill overlay ONLY when Instagram is in the foreground.
 * 2. Strictly hides the overlay immediately when user leaves Instagram (Home, Recents, other apps, screen off).
 * 3. Resets session count from 0 every time Instagram is closed/reopened.
 * 4. Tracks reel scroll direction: handles backtracking separately so main counter stays real.
 * 5. Rejects micro-jiggles, holds, and partial drags.
 * 6. Supports dragging and on-tap theme cycling.
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
    private var watchdogJob: Job? = null

    private val systemReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                Intent.ACTION_SCREEN_OFF -> {
                    Log.d(TAG, "Screen turned off: exiting Instagram session")
                    handleInstagramExited()
                }
                Intent.ACTION_CLOSE_SYSTEM_DIALOGS -> {
                    val reason = intent.getStringExtra("reason")
                    Log.d(TAG, "System dialogs closed (reason: $reason): exiting Instagram session")
                    handleInstagramExited()
                }
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

        // Callback when user taps the overlay to cycle theme
        overlayManager.onThemeCycled = { newTheme ->
            serviceScope.launch(Dispatchers.IO) {
                PreferencesRepository(this@ReelAccessibilityService).setIslandTheme(newTheme)
                ReelCounterModule.emitThemeChanged(newTheme)
            }
        }

        // Register receiver to instantly catch screen-off, home button, and recents button
        try {
            val filter = IntentFilter().apply {
                addAction(Intent.ACTION_SCREEN_OFF)
                addAction(Intent.ACTION_CLOSE_SYSTEM_DIALOGS)
            }
            registerReceiver(systemReceiver, filter)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to register systemReceiver", e)
        }

        // Recover any orphaned sessions from previous process death
        serviceScope.launch(Dispatchers.IO) {
            sessionManager.recoverOrphanedSessions()
        }

        val prefs = PreferencesRepository(this)

        // Read user overlay preference
        serviceScope.launch(Dispatchers.IO) {
            prefs.overlayEnabled.collectLatest { enabled ->
                overlayEnabled = enabled
                withContext(Dispatchers.Main) {
                    if (!enabled) {
                        overlayManager.hide()
                    } else if (isInstagramForeground) {
                        overlayManager.show(sessionManager.currentSessionCount)
                    }
                }
            }
        }

        // Read theme preference
        serviceScope.launch(Dispatchers.IO) {
            prefs.islandTheme.collectLatest { theme ->
                withContext(Dispatchers.Main) {
                    overlayManager.setTheme(theme)
                }
            }
        }

        // Read tap-to-cycle preference
        serviceScope.launch(Dispatchers.IO) {
            prefs.tapToCycleTheme.collectLatest { allowTap ->
                withContext(Dispatchers.Main) {
                    overlayManager.setTapToCycleEnabled(allowTap)
                }
            }
        }
    }

    private fun isKeyboardPackage(pkg: String): Boolean {
        val p = pkg.lowercase()
        return p.contains("keyboard") ||
               p.contains("inputmethod") ||
               p.contains("honeyboard") ||
               p.contains("swiftkey") ||
               p.contains("gboard") ||
               p.contains("autofill")
    }

    private fun isOwnApp(pkg: String): Boolean {
        return pkg.equals(packageName, ignoreCase = true)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        val pkg = event.packageName?.toString() ?: return

        // 1. Ignore own overlay interactions so they don't count or dismiss session
        if (isOwnApp(pkg)) {
            return
        }

        // 2. Handle app transitions (Instagram foreground vs background)
        if (pkg != "com.instagram.android") {
            // If it's not a soft keyboard, check if Instagram has been left
            if (!isKeyboardPackage(pkg)) {
                val activePkg = try { rootInActiveWindow?.packageName?.toString() } catch (e: Exception) { null }
                if (activePkg != "com.instagram.android") {
                    if (isInstagramForeground) {
                        Log.d(TAG, "Transitioned to $pkg (active: $activePkg): hiding overlay")
                        handleInstagramExited()
                    }
                }
            }
            return
        }

        // 3. Below this point, event is inside com.instagram.android
        if (!isInstagramForeground) {
            Log.d(TAG, "Entered Instagram: showing overlay and starting fresh session")
            handleInstagramEntered()
        }

        // 4. Update current surface (detect if in comments, DMs, etc.)
        val className = event.className?.toString()
        val eventTexts = event.text?.joinToString(" ")
        reelsScrollDetector.updateCurrentSurface(className, eventTexts)

        // 5. Process reel scrolling
        if (event.eventType == AccessibilityEvent.TYPE_VIEW_SCROLLED) {
            when (reelsScrollDetector.detectScrollDirection(event)) {
                ScrollDirection.NEXT -> {
                    serviceScope.launch {
                        sessionManager.handleNextReel()
                    }
                }
                ScrollDirection.PREVIOUS -> {
                    sessionManager.handlePreviousReel()
                }
                ScrollDirection.NONE -> {}
            }
        } else if (event.eventType == AccessibilityEvent.TYPE_WINDOWS_CHANGED) {
            checkForegroundStatus()
        }
    }

    private fun checkForegroundStatus() {
        if (!isInstagramForeground) return
        val activePkg = try { rootInActiveWindow?.packageName?.toString() } catch (e: Exception) { null }
        if (activePkg != null && activePkg != "com.instagram.android" && !isKeyboardPackage(activePkg)) {
            Log.d(TAG, "checkForegroundStatus: active package changed to $activePkg")
            handleInstagramExited()
        }
    }

    private fun startWatchdog() {
        watchdogJob?.cancel()
        watchdogJob = serviceScope.launch {
            while (isInstagramForeground) {
                delay(400)
                val activePkg = try { rootInActiveWindow?.packageName?.toString() } catch (e: Exception) { null }
                if (activePkg != null && activePkg != "com.instagram.android" && !isKeyboardPackage(activePkg)) {
                    Log.d(TAG, "Watchdog detected exit to $activePkg")
                    handleInstagramExited()
                    break
                }
            }
        }
    }

    private fun handleInstagramEntered() {
        isInstagramForeground = true
        reelsScrollDetector.reset()
        startWatchdog()
        sessionManager.startSession { initialCount ->
            if (overlayEnabled) {
                overlayManager.show(initialCount)
            }
        }
    }

    private fun handleInstagramExited() {
        if (!isInstagramForeground) return
        isInstagramForeground = false
        watchdogJob?.cancel()
        watchdogJob = null
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
            unregisterReceiver(systemReceiver)
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

    /** Called by ReelCounterModule when theme preference changes. */
    fun setIslandTheme(theme: String) {
        overlayManager.setTheme(theme)
    }

    /** Called by ReelCounterModule when tap to cycle preference changes. */
    fun setTapToCycleEnabled(enabled: Boolean) {
        overlayManager.setTapToCycleEnabled(enabled)
    }
}
