package com.reelcounter.flick

import android.content.Context
import android.graphics.PixelFormat
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.WindowManager
import androidx.core.view.WindowInsetsCompat

/**
 * Manages the floating Dynamic Island overlay using WindowManager.
 * All methods are safe to call from any thread (dispatches to main thread).
 */
class OverlayManager(private val context: Context) {

    private val windowManager = context.getSystemService(WindowManager::class.java)
    private val mainHandler = Handler(Looper.getMainLooper())
    private var islandView: IslandView? = null
    private var isShowing = false

    fun show(count: Int) {
        if (!Settings.canDrawOverlays(context)) return
        mainHandler.post {
            if (isShowing) return@post
            val view = IslandView(context)
            view.setCount(count, animate = false)
            val params = createLayoutParams()
            windowManager.addView(view, params)
            islandView = view
            isShowing = true
        }
    }

    fun updateCount(count: Int) {
        mainHandler.post {
            islandView?.setCount(count, animate = true)
        }
    }

    fun hide() {
        mainHandler.post {
            if (!isShowing) return@post
            try {
                islandView?.let { windowManager.removeView(it) }
            } catch (e: Exception) {
                // View may have already been removed
            }
            islandView = null
            isShowing = false
        }
    }

    fun isVisible(): Boolean = isShowing

    private fun createLayoutParams(): WindowManager.LayoutParams {
        val statusBarHeight = getStatusBarHeight()
        return WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            y = statusBarHeight + dpToPx(4)
        }
    }

    private fun getStatusBarHeight(): Int {
        return try {
            val resourceId = context.resources.getIdentifier("status_bar_height", "dimen", "android")
            if (resourceId > 0) context.resources.getDimensionPixelSize(resourceId) else dpToPx(24)
        } catch (e: Exception) {
            dpToPx(24)
        }
    }

    private fun dpToPx(dp: Int): Int {
        return (dp * context.resources.displayMetrics.density).toInt()
    }
}
