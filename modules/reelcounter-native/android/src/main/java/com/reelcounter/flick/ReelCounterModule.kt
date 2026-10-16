package com.reelcounter.flick

import android.os.Bundle
import com.facebook.react.bridge.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

/**
 * React Native bridge module exposing all Kotlin functionality.
 *
 * Uses the legacy ReactContextBaseJavaModule pattern (compatible with
 * all Expo SDK versions including SDK 57 / RN 0.86.x).
 *
 * Methods run on background threads; UI updates posted via callbacks.
 */
class ReelCounterModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val moduleScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun getName(): String = "ReelCounter"

    // ---- Permissions ----

    @ReactMethod
    fun isAccessibilityEnabled(promise: Promise) {
        promise.resolve(PermissionHelper.isAccessibilityEnabled(reactApplicationContext))
    }

    @ReactMethod
    fun isOverlayEnabled(promise: Promise) {
        promise.resolve(PermissionHelper.isOverlayEnabled(reactApplicationContext))
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        PermissionHelper.openAccessibilitySettings(reactApplicationContext)
    }

    @ReactMethod
    fun openOverlaySettings() {
        PermissionHelper.openOverlaySettings(reactApplicationContext)
    }

    // ---- Statistics ----

    @ReactMethod
    fun getTodayCount(promise: Promise) {
        moduleScope.launch {
            try {
                val count = AppDatabase.getInstance(reactApplicationContext)
                    .eventDao().getCountForDate(DateUtils.todayLocalDate())
                promise.resolve(count)
            } catch (e: Exception) {
                promise.reject("DB_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun getYesterdayCount(promise: Promise) {
        moduleScope.launch {
            try {
                val count = AppDatabase.getInstance(reactApplicationContext)
                    .eventDao().getCountForDate(DateUtils.yesterdayLocalDate())
                promise.resolve(count)
            } catch (e: Exception) {
                promise.reject("DB_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun getLast7DaysTotal(promise: Promise) {
        moduleScope.launch {
            try {
                val count = AppDatabase.getInstance(reactApplicationContext)
                    .eventDao().getTotalSinceDate(DateUtils.daysAgoLocalDate(7))
                promise.resolve(count)
            } catch (e: Exception) {
                promise.reject("DB_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun getAllTimeTotal(promise: Promise) {
        moduleScope.launch {
            try {
                val count = AppDatabase.getInstance(reactApplicationContext)
                    .eventDao().getAllTimeTotal()
                promise.resolve(count)
            } catch (e: Exception) {
                promise.reject("DB_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun getDailySummary(limit: Int, promise: Promise) {
        moduleScope.launch {
            try {
                val summaries = AppDatabase.getInstance(reactApplicationContext)
                    .eventDao().getDailySummary(limit)
                val array = Arguments.createArray()
                for (s in summaries) {
                    val map = Arguments.createMap()
                    map.putString("localDate", s.localDate)
                    map.putInt("count", s.count)
                    array.pushMap(map)
                }
                promise.resolve(array)
            } catch (e: Exception) {
                promise.reject("DB_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun getSessionStats(promise: Promise) {
        moduleScope.launch {
            try {
                val db = AppDatabase.getInstance(reactApplicationContext)
                val totalSessions = db.sessionDao().getTotalCompletedSessions()
                val sessionsToday = db.sessionDao().getSessionsCountForDate(DateUtils.todayLocalDate())
                val avgPerSession = db.sessionDao().getAverageReelsPerSession() ?: 0f
                val longestSession = db.sessionDao().getLongestSessionCount() ?: 0

                // 7-day rolling average
                val last7Total = db.eventDao().getTotalSinceDate(DateUtils.daysAgoLocalDate(7))
                val avgDailyReels = if (last7Total > 0) last7Total / 7f else 0f

                val map = Arguments.createMap()
                map.putInt("totalSessions", totalSessions)
                map.putInt("sessionsToday", sessionsToday)
                map.putDouble("avgReelsPerSession", avgPerSession.toDouble())
                map.putInt("longestSessionCount", longestSession)
                map.putDouble("avgDailyReels", avgDailyReels.toDouble())
                promise.resolve(map)
            } catch (e: Exception) {
                promise.reject("DB_ERROR", e.message)
            }
        }
    }

    // ---- Preferences ----

    @ReactMethod
    fun getOverlayPreference(promise: Promise) {
        moduleScope.launch {
            try {
                val enabled = PreferencesRepository(reactApplicationContext).getOverlayEnabled()
                promise.resolve(enabled)
            } catch (e: Exception) {
                promise.resolve(true)
            }
        }
    }

    @ReactMethod
    fun setOverlayPreference(enabled: Boolean, promise: Promise) {
        moduleScope.launch {
            try {
                PreferencesRepository(reactApplicationContext).setOverlayEnabled(enabled)
                // Update running service if active
                ReelAccessibilityService.instance?.setOverlayEnabled(enabled)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("PREF_ERROR", e.message)
            }
        }
    }

    // ---- Data management ----

    @ReactMethod
    fun clearAllData(promise: Promise) {
        moduleScope.launch {
            try {
                val db = AppDatabase.getInstance(reactApplicationContext)
                db.sessionDao().deleteAll()
                db.eventDao().deleteAll()
                WidgetUpdater.update(reactApplicationContext)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("DB_ERROR", e.message)
            }
        }
    }

    // ---- Event emitter support ----

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN event emitter; no-op
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN event emitter; no-op
    }

    override fun invalidate() {
        moduleScope.cancel()
        super.invalidate()
    }

    companion object {
        private var eventEmitter: com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter? = null

        fun initEmitter(ctx: ReactApplicationContext) {
            eventEmitter = ctx.getJSModule(
                com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
            )
        }

        fun emitReelCounted(sessionCount: Int, todayCount: Int) {
            try {
                val map = Arguments.createMap()
                map.putInt("sessionCount", sessionCount)
                map.putInt("todayCount", todayCount)
                eventEmitter?.emit("onReelCounted", map)
            } catch (e: Exception) {
                // RN context may not be active; safe to ignore
            }
        }
    }
}
