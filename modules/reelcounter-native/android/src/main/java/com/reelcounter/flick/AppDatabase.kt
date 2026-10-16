package com.reelcounter.flick

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext

/**
 * Standard Android SQLiteOpenHelper database implementation.
 *
 * Eliminates dependencies on Room and KAPT compiler, guaranteeing
 * clean, reliable builds across all Android Gradle and Kotlin versions.
 */
class AppDatabase private constructor(context: Context) :
    SQLiteOpenHelper(context.applicationContext, "reelcounter.db", null, 1) {

    private val sessionDaoImpl = SessionDaoImpl(this)
    private val eventDaoImpl = EventDaoImpl(this)

    fun sessionDao(): ReelSessionDao = sessionDaoImpl
    fun eventDao(): ReelEventDao = eventDaoImpl

    override fun onConfigure(db: SQLiteDatabase) {
        super.onConfigure(db)
        db.setForeignKeyConstraintsEnabled(true)
    }

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS reel_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                startTime INTEGER NOT NULL,
                endTime INTEGER,
                localStartDate TEXT NOT NULL,
                reelCount INTEGER NOT NULL DEFAULT 0,
                endReason TEXT
            )
            """.trimIndent()
        )

        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS reel_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                sessionId INTEGER NOT NULL,
                timestamp INTEGER NOT NULL,
                localDate TEXT NOT NULL,
                detectionSource TEXT NOT NULL,
                FOREIGN KEY(sessionId) REFERENCES reel_sessions(id) ON DELETE CASCADE
            )
            """.trimIndent()
        )

        db.execSQL("CREATE INDEX IF NOT EXISTS index_reel_events_sessionId ON reel_events(sessionId)")
        db.execSQL("CREATE INDEX IF NOT EXISTS index_reel_events_localDate ON reel_events(localDate)")
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS reel_events")
        db.execSQL("DROP TABLE IF EXISTS reel_sessions")
        onCreate(db)
    }

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: AppDatabase(context).also { INSTANCE = it }
            }
        }
    }
}

private class SessionDaoImpl(private val dbHelper: AppDatabase) : ReelSessionDao {
    override suspend fun insert(session: ReelSession): Long = withContext(Dispatchers.IO) {
        val db = dbHelper.writableDatabase
        val cv = ContentValues().apply {
            put("startTime", session.startTime)
            if (session.endTime != null) put("endTime", session.endTime) else putNull("endTime")
            put("localStartDate", session.localStartDate)
            put("reelCount", session.reelCount)
            if (session.endReason != null) put("endReason", session.endReason) else putNull("endReason")
        }
        db.insert("reel_sessions", null, cv)
    }

    override suspend fun incrementCount(id: Long) = withContext(Dispatchers.IO) {
        val db = dbHelper.writableDatabase
        db.execSQL("UPDATE reel_sessions SET reelCount = reelCount + 1 WHERE id = ?", arrayOf(id.toString()))
    }

    override suspend fun finalize(id: Long, endTime: Long, reason: String) = withContext(Dispatchers.IO) {
        val db = dbHelper.writableDatabase
        val cv = ContentValues().apply {
            put("endTime", endTime)
            put("endReason", reason)
        }
        db.update("reel_sessions", cv, "id = ?", arrayOf(id.toString()))
        Unit
    }

    override suspend fun getOrphanedSessions(): List<ReelSession> = withContext(Dispatchers.IO) {
        val db = dbHelper.readableDatabase
        val list = mutableListOf<ReelSession>()
        db.rawQuery(
            "SELECT id, startTime, endTime, localStartDate, reelCount, endReason FROM reel_sessions WHERE endTime IS NULL",
            null
        ).use { cursor ->
            while (cursor.moveToNext()) {
                list.add(cursorToSession(cursor))
            }
        }
        list
    }

    override fun getSessionsForDate(date: String): Flow<List<ReelSession>> = flow {
        val db = dbHelper.readableDatabase
        val list = mutableListOf<ReelSession>()
        db.rawQuery(
            "SELECT id, startTime, endTime, localStartDate, reelCount, endReason FROM reel_sessions WHERE localStartDate = ? ORDER BY startTime DESC",
            arrayOf(date)
        ).use { cursor ->
            while (cursor.moveToNext()) {
                list.add(cursorToSession(cursor))
            }
        }
        emit(list)
    }.flowOn(Dispatchers.IO)

    override suspend fun getTotalCompletedSessions(): Int = withContext(Dispatchers.IO) {
        val db = dbHelper.readableDatabase
        db.rawQuery("SELECT COUNT(*) FROM reel_sessions WHERE reelCount > 0", null).use { cursor ->
            if (cursor.moveToFirst()) cursor.getInt(0) else 0
        }
    }

    override suspend fun getLongestSessionCount(): Int? = withContext(Dispatchers.IO) {
        val db = dbHelper.readableDatabase
        db.rawQuery("SELECT MAX(reelCount) FROM reel_sessions", null).use { cursor ->
            if (cursor.moveToFirst() && !cursor.isNull(0)) cursor.getInt(0) else null
        }
    }

    override suspend fun getAverageReelsPerSession(): Float? = withContext(Dispatchers.IO) {
        val db = dbHelper.readableDatabase
        db.rawQuery("SELECT AVG(CAST(reelCount AS REAL)) FROM reel_sessions WHERE reelCount > 0", null).use { cursor ->
            if (cursor.moveToFirst() && !cursor.isNull(0)) cursor.getFloat(0) else null
        }
    }

    override suspend fun getSessionsCountForDate(date: String): Int = withContext(Dispatchers.IO) {
        val db = dbHelper.readableDatabase
        db.rawQuery("SELECT COUNT(*) FROM reel_sessions WHERE localStartDate = ? AND reelCount > 0", arrayOf(date)).use { cursor ->
            if (cursor.moveToFirst()) cursor.getInt(0) else 0
        }
    }

    override suspend fun deleteAll() = withContext(Dispatchers.IO) {
        val db = dbHelper.writableDatabase
        db.delete("reel_sessions", null, null)
        Unit
    }

    private fun cursorToSession(cursor: Cursor): ReelSession {
        val id = cursor.getLong(0)
        val startTime = cursor.getLong(1)
        val endTime = if (cursor.isNull(2)) null else cursor.getLong(2)
        val localStartDate = cursor.getString(3)
        val reelCount = cursor.getInt(4)
        val endReason = if (cursor.isNull(5)) null else cursor.getString(5)
        return ReelSession(id, startTime, endTime, localStartDate, reelCount, endReason)
    }
}

private class EventDaoImpl(private val dbHelper: AppDatabase) : ReelEventDao {
    override suspend fun insert(event: ReelEvent): Long = withContext(Dispatchers.IO) {
        val db = dbHelper.writableDatabase
        val cv = ContentValues().apply {
            put("sessionId", event.sessionId)
            put("timestamp", event.timestamp)
            put("localDate", event.localDate)
            put("detectionSource", event.detectionSource)
        }
        db.insert("reel_events", null, cv)
    }

    override suspend fun getCountForDate(date: String): Int = withContext(Dispatchers.IO) {
        val db = dbHelper.readableDatabase
        db.rawQuery("SELECT COUNT(*) FROM reel_events WHERE localDate = ?", arrayOf(date)).use { cursor ->
            if (cursor.moveToFirst()) cursor.getInt(0) else 0
        }
    }

    override suspend fun getDailySummary(limit: Int): List<DailySummary> = withContext(Dispatchers.IO) {
        val db = dbHelper.readableDatabase
        val list = mutableListOf<DailySummary>()
        val sql = """
            SELECT localDate, COUNT(*) as count 
            FROM reel_events 
            GROUP BY localDate 
            ORDER BY localDate DESC 
            LIMIT ?
        """.trimIndent()
        db.rawQuery(sql, arrayOf(limit.toString())).use { cursor ->
            while (cursor.moveToNext()) {
                val date = cursor.getString(0)
                val count = cursor.getInt(1)
                list.add(DailySummary(date, count))
            }
        }
        list
    }

    override suspend fun getTotalSinceDate(startDate: String): Int = withContext(Dispatchers.IO) {
        val db = dbHelper.readableDatabase
        db.rawQuery("SELECT COUNT(*) FROM reel_events WHERE localDate >= ?", arrayOf(startDate)).use { cursor ->
            if (cursor.moveToFirst()) cursor.getInt(0) else 0
        }
    }

    override suspend fun getAllTimeTotal(): Int = withContext(Dispatchers.IO) {
        val db = dbHelper.readableDatabase
        db.rawQuery("SELECT COUNT(*) FROM reel_events", null).use { cursor ->
            if (cursor.moveToFirst()) cursor.getInt(0) else 0
        }
    }

    override suspend fun deleteAll() = withContext(Dispatchers.IO) {
        val db = dbHelper.writableDatabase
        db.delete("reel_events", null, null)
        Unit
    }
}
