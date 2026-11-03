package com.reelcounter.flick

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.animation.PropertyValuesHolder
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.SystemClock
import android.util.DisplayMetrics
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.WindowManager
import android.view.animation.AccelerateInterpolator
import android.view.animation.DecelerateInterpolator
import android.view.animation.OvershootInterpolator
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import kotlin.math.abs

/**
 * Movable, theme-switchable pill overlay rendered on top of Instagram.
 * Supports:
 * - 4 distinct cute theme presets: Classic Island, Neko Cat, Pixel Arcade, Cloud Bunny.
 * - Smooth dragging to reposition anywhere on screen with boundary clamping and saved state.
 * - Tap to cycle theme with a playful bounce animation.
 */
class IslandView(
    context: Context,
    private val windowManager: WindowManager,
    private val layoutParams: WindowManager.LayoutParams
) : FrameLayout(context) {

    var onThemeCycled: ((String) -> Unit)? = null
    var tapToCycleEnabled: Boolean = true

    private var currentCount = 0
    private var currentTheme = "classic"

    // Views
    private val pillContainer: LinearLayout
    private val iconText: TextView
    private val countText: TextView
    private val catEarsContainer: LinearLayout
    private val leftEar: View
    private val rightEar: View

    // Drag tracking
    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var touchStartTime = 0L
    private var isDragging = false
    private val touchSlop = ViewConfiguration.get(context).scaledTouchSlop

    init {
        val dp = resources.displayMetrics.density

        // Root container holds Cat Ears (top) + Pill Container (bottom)
        val rootLayout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
        }

        // Cat ears container for the "neko" theme
        catEarsContainer = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_HORIZONTAL
            visibility = View.GONE
        }

        val earSize = (10 * dp).toInt()
        val earMargin = (16 * dp).toInt()

        leftEar = View(context).apply {
            layoutParams = LinearLayout.LayoutParams(earSize, earSize).apply {
                marginEnd = earMargin
            }
            background = createEarDrawable()
            rotation = -15f
        }

        rightEar = View(context).apply {
            layoutParams = LinearLayout.LayoutParams(earSize, earSize).apply {
                marginStart = earMargin
            }
            background = createEarDrawable()
            rotation = 15f
        }

        catEarsContainer.addView(leftEar)
        catEarsContainer.addView(rightEar)
        rootLayout.addView(catEarsContainer)

        // Pill body container
        pillContainer = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            elevation = 10f * dp
        }

        iconText = TextView(context).apply {
            textSize = 12f
            gravity = Gravity.CENTER
            setTextColor(0xFFFF6B00.toInt())
            text = "▶"
        }

        countText = TextView(context).apply {
            val margin = (7 * dp).toInt()
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).also { it.marginStart = margin }
            setTextColor(0xFFFFFFFF.toInt())
            textSize = 13f
            setTypeface(typeface, Typeface.BOLD)
            text = "0 reels"
        }

        pillContainer.addView(iconText)
        pillContainer.addView(countText)
        rootLayout.addView(pillContainer)

        addView(rootLayout)

        // Apply initial default theme
        applyThemeStyles("classic")

        // Setup touch & drag listener
        setupTouchListener()
    }

    private fun createEarDrawable(): GradientDrawable {
        val dp = resources.displayMetrics.density
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 3f * dp
            setColor(0xFF1E1428.toInt())
            setStroke((1.5f * dp).toInt(), 0xFFFF7597.toInt())
        }
    }

    fun setTheme(theme: String) {
        if (currentTheme == theme) return
        currentTheme = theme
        applyThemeStyles(theme)
    }

    fun getTheme(): String = currentTheme

    private fun applyThemeStyles(theme: String) {
        val dp = resources.displayMetrics.density
        val horizontal = (16 * dp).toInt()
        val vertical = (9 * dp).toInt()

        when (theme) {
            "neko" -> {
                // Kawaii Cat: Cute cat ears, soft midnight rose background, pink paw icon
                catEarsContainer.visibility = View.VISIBLE
                val pill = GradientDrawable().apply {
                    shape = GradientDrawable.RECTANGLE
                    cornerRadius = 500f * dp
                    setColor(0xFF161122.toInt())
                    setStroke((1.8f * dp).toInt(), 0xFFFF7597.toInt())
                }
                pillContainer.background = pill
                pillContainer.setPadding(horizontal, vertical, horizontal, vertical)

                iconText.text = "🐾"
                iconText.textSize = 13f
                countText.setTextColor(0xFFFFF0F5.toInt())
                countText.typeface = Typeface.DEFAULT_BOLD
            }
            "pixel" -> {
                // Retro Arcade: Sharp pixel border, cyber neon green, retro 8-bit styling
                catEarsContainer.visibility = View.GONE
                val pill = GradientDrawable().apply {
                    shape = GradientDrawable.RECTANGLE
                    cornerRadius = 4f * dp // sharp pixelated corners
                    setColor(0xFF090E17.toInt())
                    setStroke((2f * dp).toInt(), 0xFF00FFA3.toInt())
                }
                pillContainer.background = pill
                pillContainer.setPadding((14 * dp).toInt(), (8 * dp).toInt(), (14 * dp).toInt(), (8 * dp).toInt())

                iconText.text = "👾"
                iconText.textSize = 12f
                countText.setTextColor(0xFFE2FFF5.toInt())
                countText.typeface = Typeface.MONOSPACE
            }
            "cloud" -> {
                // Cloud Bunny: Fluffy dreamy aesthetic, starry pastel lavender/gold
                catEarsContainer.visibility = View.GONE
                val pill = GradientDrawable().apply {
                    shape = GradientDrawable.RECTANGLE
                    cornerRadius = 24f * dp
                    setColor(0xFF11142A.toInt())
                    setStroke((1.8f * dp).toInt(), 0xFF9FA8DA.toInt())
                }
                pillContainer.background = pill
                pillContainer.setPadding(horizontal, vertical, horizontal, vertical)

                iconText.text = "✨"
                iconText.textSize = 13f
                countText.setTextColor(0xFFEDE7F6.toInt())
                countText.typeface = Typeface.DEFAULT_BOLD
            }
            else -> {
                // Classic Island: Obsidian pill with sunset orange border & play icon
                catEarsContainer.visibility = View.GONE
                val pill = GradientDrawable().apply {
                    shape = GradientDrawable.RECTANGLE
                    cornerRadius = 500f * dp
                    setColor(0xFF000000.toInt())
                    setStroke((1.5f * dp).toInt(), 0xB3FF6B00.toInt())
                }
                pillContainer.background = pill
                pillContainer.setPadding(horizontal, vertical, horizontal, vertical)

                iconText.text = "▶"
                iconText.textSize = 10f
                iconText.setTextColor(0xFFFF6B00.toInt())
                countText.setTextColor(0xFFFFFFFF.toInt())
                countText.typeface = Typeface.DEFAULT_BOLD
            }
        }

        updateTextLabel()
    }

    private fun updateTextLabel() {
        val label = if (currentTheme == "pixel") {
            if (currentCount == 1) "$currentCount REEL" else "$currentCount REELS"
        } else {
            if (currentCount == 1) "$currentCount reel" else "$currentCount reels"
        }
        countText.text = label
    }

    fun setCount(count: Int, animate: Boolean) {
        currentCount = count
        updateTextLabel()

        if (animate) {
            playPopAnimation(1.14f)
        }
    }

    private fun playPopAnimation(scaleMax: Float) {
        val scaleUp = ObjectAnimator.ofPropertyValuesHolder(
            this,
            PropertyValuesHolder.ofFloat("scaleX", 1f, scaleMax),
            PropertyValuesHolder.ofFloat("scaleY", 1f, scaleMax)
        ).apply {
            duration = 130
            interpolator = AccelerateInterpolator()
        }
        val scaleDown = ObjectAnimator.ofPropertyValuesHolder(
            this,
            PropertyValuesHolder.ofFloat("scaleX", scaleMax, 1f),
            PropertyValuesHolder.ofFloat("scaleY", scaleMax, 1f)
        ).apply {
            duration = 160
            interpolator = OvershootInterpolator(1.4f)
        }
        AnimatorSet().apply {
            playSequentially(scaleUp, scaleDown)
            start()
        }
    }

    private fun getNextTheme(theme: String): String {
        return when (theme) {
            "classic" -> "neko"
            "neko" -> "pixel"
            "pixel" -> "cloud"
            else -> "classic"
        }
    }

    private fun setupTouchListener() {
        setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = layoutParams.x
                    initialY = layoutParams.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    touchStartTime = SystemClock.uptimeMillis()
                    isDragging = false
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = (event.rawX - initialTouchX).toInt()
                    val dy = (event.rawY - initialTouchY).toInt()

                    if (!isDragging && (abs(dx) > touchSlop || abs(dy) > touchSlop)) {
                        isDragging = true
                    }

                    if (isDragging) {
                        layoutParams.x = clampX(initialX + dx)
                        layoutParams.y = clampY(initialY + dy)
                        try {
                            windowManager.updateViewLayout(this, layoutParams)
                        } catch (e: Exception) {
                            // View might be detached
                        }
                    }
                    true
                }
                MotionEvent.ACTION_UP -> {
                    val duration = SystemClock.uptimeMillis() - touchStartTime
                    if (!isDragging && duration < 380) {
                        // User tapped the pill!
                        if (tapToCycleEnabled) {
                            val nextTheme = getNextTheme(currentTheme)
                            setTheme(nextTheme)
                            playPopAnimation(1.2f)
                            onThemeCycled?.invoke(nextTheme)
                        }
                    } else if (isDragging) {
                        // Save new position
                        savePosition(layoutParams.x, layoutParams.y)
                    }
                    true
                }
                else -> false
            }
        }
    }

    private fun clampX(x: Int): Int {
        val dm = resources.displayMetrics
        val viewWidth = if (width > 0) width else (140 * dm.density).toInt()
        val maxX = dm.widthPixels - viewWidth
        return x.coerceIn(0, maxX.coerceAtLeast(0))
    }

    private fun clampY(y: Int): Int {
        val dm = resources.displayMetrics
        val viewHeight = if (height > 0) height else (45 * dm.density).toInt()
        val maxY = dm.heightPixels - viewHeight
        return y.coerceIn(0, maxY.coerceAtLeast(0))
    }

    private fun savePosition(x: Int, y: Int) {
        val prefs = context.getSharedPreferences("flick_overlay_pos", Context.MODE_PRIVATE)
        prefs.edit().putInt("pos_x", x).putInt("pos_y", y).apply()
    }
}
