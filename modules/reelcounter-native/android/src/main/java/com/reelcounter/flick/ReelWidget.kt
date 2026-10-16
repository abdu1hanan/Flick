package com.reelcounter.flick

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.app.PendingIntent
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.Dispatchers

class ReelWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        // Handle date-change and time-set broadcasts
        if (intent.action == Intent.ACTION_DATE_CHANGED ||
            intent.action == Intent.ACTION_TIME_CHANGED) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val ids = appWidgetManager.getAppWidgetIds(
                android.content.ComponentName(context, ReelWidget::class.java)
            )
            for (id in ids) updateWidget(context, appWidgetManager, id)
        }
    }

    companion object {
        fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            // Must run on background thread — using runBlocking here since called from BroadcastReceiver
            val count = runBlocking(Dispatchers.IO) {
                AppDatabase.getInstance(context)
                    .eventDao()
                    .getCountForDate(DateUtils.todayLocalDate())
            }

            val views = RemoteViews(context.packageName, getWidgetLayoutId(context))
            val label = when (count) {
                0 -> "0 reels today"
                1 -> "1 reel today"
                else -> "$count reels today"
            }
            views.setTextViewText(getWidgetTextId(context), label)

            // Tap to open app
            val launchIntent = context.packageManager
                .getLaunchIntentForPackage(context.packageName)
            if (launchIntent != null) {
                val pendingIntent = PendingIntent.getActivity(
                    context, 0, launchIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(getWidgetRootId(context), pendingIntent)
            }

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        // Resolve layout resource IDs by name to handle the generated android/ directory
        private fun getWidgetLayoutId(context: Context): Int =
            context.resources.getIdentifier("widget_island", "layout", context.packageName)

        private fun getWidgetTextId(context: Context): Int =
            context.resources.getIdentifier("widget_count_text", "id", context.packageName)

        private fun getWidgetRootId(context: Context): Int =
            context.resources.getIdentifier("widget_root", "id", context.packageName)
    }
}
