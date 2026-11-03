package com.reelcounter.flick

import android.content.Context
import android.graphics.PixelFormat
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.WindowManager

/**
 * Manages the floating Dynamic Island overlay using WindowManager.
 * Supports dragging and on-tap theme cycling.
 */
class OverlayManager(private val context: Context) {

    private val windowManager = context.getSystemService(WindowManager::class.java)
    private val mainHandler = Handler(Looper.getMainLooper())
    private var islandView: IslandView? = null
    private var isShowing = false
    private var currentCount = 0

    var currentTheme = "classic"
    var tapToCycleEnabled = true
    var onThemeCycled: ((String) -> Unit)? = null

    fun setTheme(theme: String) {
        currentTheme = theme
        mainHandler.post {
            islandView?.setTheme(theme)
        }
    }

    fun setTapToCycleEnabled(enabled: Boolean) {
        tapToCycleEnabled = enabled
        mainHandler.post {
            islandView?.tapToCycleEnabled = enabled
        }
    }

    fun show(count: Int) {
        if (!Settings.canDrawOverlays(context)) return
        currentCount = count
        mainHandler.post {
            if (isShowing) {
                islandView?.setCount(count, animate = false)
                return@post
            }
            val params = createLayoutParams()
            val view = IslandView(context, windowManager, params).apply {
                this.tapToCycleEnabled = this@OverlayManager.tapToCycleEnabled
                this.setTheme(this@OverlayManager.currentTheme)
                this.setCount(count, animate = false)
                this.onThemeCycled = { theme ->
                    this@OverlayManager.currentTheme = theme
                    this@OverlayManager.onThemeCycled?.invoke(theme)
                }
            }

            try {
                windowManager.addView(view, params)
                islandView = view
                isShowing = true
            } catch (e: Exception) {
                // View may already be added or permission revoked
            }
        }
    }

    fun updateCount(count: Int) {
        currentCount = count
        mainHandler.post {
            if (isShowing) {
                islandView?.setCount(count, animate = true)
            }
        }
    }

    fun hide() {
        mainHandler.post {
            if (!isShowing && islandView == null) return@post
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
        val dm = context.resources.displayMetrics
        val statusBarHeight = getStatusBarHeight()
        val prefs = context.getSharedPreferences("flick_overlay_pos", Context.MODE_PRIVATE)
        val savedX = prefs.getInt("pos_x", -1)
        val savedY = prefs.getInt("pos_y", -1)

        val posX = if (savedX >= 0) savedX else ((dm.widthPixels - (140 * dm.density).toInt()) / 2)
        val posY = if (savedY >= 0) savedY else (statusBarHeight + (8 * dm.density).toInt())

        return WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = posX
            y = posY
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
