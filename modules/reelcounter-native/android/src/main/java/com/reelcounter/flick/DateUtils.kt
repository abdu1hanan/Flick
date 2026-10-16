package com.reelcounter.flick

import java.util.Calendar

object DateUtils {
    fun todayLocalDate(): String = formatDate(Calendar.getInstance())

    fun yesterdayLocalDate(): String {
        val cal = Calendar.getInstance()
        cal.add(Calendar.DAY_OF_YEAR, -1)
        return formatDate(cal)
    }

    fun daysAgoLocalDate(days: Int): String {
        val cal = Calendar.getInstance()
        cal.add(Calendar.DAY_OF_YEAR, -days)
        return formatDate(cal)
    }

    private fun formatDate(cal: Calendar): String {
        return String.format(
            "%04d-%02d-%02d",
            cal.get(Calendar.YEAR),
            cal.get(Calendar.MONTH) + 1,
            cal.get(Calendar.DAY_OF_MONTH)
        )
    }
}
