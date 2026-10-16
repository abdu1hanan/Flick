package com.reelcounter.flick

import android.content.Context
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView

/**
 * The actual pill/island view rendered over Instagram.
 * Built entirely programmatically (no XML inflation needed).
 */
class IslandView(context: Context) : FrameLayout(context) {

    private val countText: TextView
    private val iconView: ImageView

    init {
        // Build outer pill container
        val pill = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 500f * resources.displayMetrics.density
            setColor(0xFF000000.toInt())
            setStroke((1.5f * resources.displayMetrics.density).toInt(), 0xB3FF6B00.toInt())
        }
        background = pill
        elevation = 8f * resources.displayMetrics.density

        val dp = resources.displayMetrics.density
        val horizontal = (16 * dp).toInt()
        val vertical = (9 * dp).toInt()
        setPadding(horizontal, vertical, horizontal, vertical)

        val row = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        iconView = ImageView(context).apply {
            val size = (16 * dp).toInt()
            layoutParams = LinearLayout.LayoutParams(size, size)
            // Use the play triangle drawable in orange
            try {
                setImageResource(resources.getIdentifier("ic_reel", "drawable", context.packageName))
                setColorFilter(0xFFFF6B00.toInt())
            } catch (e: Exception) {
                // Fallback: no icon if resource not found
            }
        }

        countText = TextView(context).apply {
            val margin = (6 * dp).toInt()
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).also { it.marginStart = margin }
            setTextColor(0xFFFFFFFF.toInt())
            textSize = 13f
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            text = "0 reels"
        }

        row.addView(iconView)
        row.addView(countText)
        addView(row)
    }

    fun setCount(count: Int, animate: Boolean) {
        val label = if (count == 1) "$count reel" else "$count reels"
        countText.text = label

        if (animate) {
            val scaleUp = android.animation.ObjectAnimator.ofPropertyValuesHolder(
                this,
                android.animation.PropertyValuesHolder.ofFloat("scaleX", 1f, 1.12f),
                android.animation.PropertyValuesHolder.ofFloat("scaleY", 1f, 1.12f)
            ).apply {
                duration = 140
                interpolator = android.view.animation.AccelerateInterpolator()
            }
            val scaleDown = android.animation.ObjectAnimator.ofPropertyValuesHolder(
                this,
                android.animation.PropertyValuesHolder.ofFloat("scaleX", 1.12f, 1f),
                android.animation.PropertyValuesHolder.ofFloat("scaleY", 1.12f, 1f)
            ).apply {
                duration = 140
                interpolator = android.view.animation.DecelerateInterpolator()
            }
            android.animation.AnimatorSet().apply {
                playSequentially(scaleUp, scaleDown)
                start()
            }
        }
    }
}
