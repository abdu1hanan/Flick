package com.reelcounter.flick

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent

/**
 * Sends a broadcast to trigger a widget update.
 * Called after every reel count and on date change.
 */
object WidgetUpdater {
    fun update(context: Context) {
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val ids = appWidgetManager.getAppWidgetIds(
            ComponentName(context, ReelWidget::class.java)
        )
        if (ids.isNotEmpty()) {
            val intent = Intent(context, ReelWidget::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
            }
            context.sendBroadcast(intent)
        }
    }
}
