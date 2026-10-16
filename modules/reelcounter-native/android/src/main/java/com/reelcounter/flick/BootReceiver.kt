package com.reelcounter.flick

import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent

/**
 * Refreshes the widget after device reboot so the count doesn't show stale data.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val ids = appWidgetManager.getAppWidgetIds(
                ComponentName(context, ReelWidget::class.java)
            )
            for (id in ids) {
                ReelWidget.updateWidget(context, appWidgetManager, id)
            }
        }
    }
}
