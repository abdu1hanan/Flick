package com.reelcounter.flick

import android.content.Context
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

enum class EndReason(val value: String) {
    USER_LEFT("USER_LEFT"),
    BACKGROUNDED("BACKGROUNDED"),
    PROCESS_DEATH("PROCESS_DEATH"),
    SERVICE_DISABLED("SERVICE_DISABLED"),
    EMPTY("EMPTY")
}

data class ActiveSession(
    val dbId: Long,
    val startTime: Long,
    var reelCount: Int = 0
)

/**
 * Manages session lifecycle.
 * Writes all session state to SQLite via ReelRepository.
 *
 * Ensures each time Instagram is opened after being closed or backgrounded,
 * the session counter starts fresh from 0.
 */
class SessionManager(
    private val context: Context,
    private val scope: CoroutineScope,
    private val onCountUpdate: (sessionCount: Int, todayCount: Int) -> Unit
) {
    private val repo = ReelRepository(context)

    @Volatile
    var activeSession: ActiveSession? = null
        private set

    @Volatile
    var backtrackDebt: Int = 0
        private set

    val currentSessionCount: Int
        get() = activeSession?.reelCount ?: 0

    /** Recover any sessions that were active when the process died. */
    suspend fun recoverOrphanedSessions() {
        val orphans = repo.getOrphanedSessions()
        for (orphan in orphans) {
            if (orphan.reelCount == 0) {
                repo.finalizeSession(orphan.id, System.currentTimeMillis(), EndReason.EMPTY.value)
            } else {
                repo.finalizeSession(orphan.id, System.currentTimeMillis(), EndReason.PROCESS_DEATH.value)
            }
        }
    }

    /**
     * Start a new session. Always resets the active count and backtrack debt to 0.
     */
    fun startSession(onStarted: ((sessionCount: Int) -> Unit)? = null) {
        val oldSession = activeSession
        activeSession = null
        backtrackDebt = 0

        scope.launch(Dispatchers.IO) {
            if (oldSession != null) {
                val endTime = System.currentTimeMillis()
                if (oldSession.reelCount == 0) {
                    repo.finalizeSession(oldSession.dbId, endTime, EndReason.EMPTY.value)
                } else {
                    repo.finalizeSession(oldSession.dbId, endTime, EndReason.USER_LEFT.value)
                }
            }

            val now = System.currentTimeMillis()
            val today = DateUtils.todayLocalDate()
            val sessionId = repo.insertSession(
                ReelSession(
                    startTime = now,
                    localStartDate = today,
                    reelCount = 0
                )
            )
            val newSession = ActiveSession(dbId = sessionId, startTime = now, reelCount = 0)
            activeSession = newSession

            val todayCount = repo.getCountForDate(today)
            withContext(Dispatchers.Main) {
                onCountUpdate(0, todayCount)
                onStarted?.invoke(0)
            }
        }
    }

    /**
     * Increment the count for the active session.
     * Returns the new session count, or 0 if no session is active.
     */
    suspend fun incrementCount(): Int {
        var session = activeSession
        if (session == null) {
            // Lazy start if not started yet
            val now = System.currentTimeMillis()
            val today = DateUtils.todayLocalDate()
            val sessionId = repo.insertSession(
                ReelSession(
                    startTime = now,
                    localStartDate = today,
                    reelCount = 0
                )
            )
            session = ActiveSession(dbId = sessionId, startTime = now, reelCount = 0)
            activeSession = session
        }

        session.reelCount++
        repo.incrementSessionCount(session.dbId)

        val now = System.currentTimeMillis()
        val today = DateUtils.todayLocalDate()
        repo.insertEvent(
            ReelEvent(
                sessionId = session.dbId,
                timestamp = now,
                localDate = today,
                detectionSource = "SCROLL_UP"
            )
        )

        val todayCount = repo.getCountForDate(today)
        withContext(Dispatchers.Main) {
            onCountUpdate(session.reelCount, todayCount)
        }
        return session.reelCount
    }

    /**
     * Called when user scrolls backward to a previous reel.
     * Backtrack debt is increased (capped at the current session reel count),
     * ensuring the main counter never decrements, but future forward scrolls
     * will first consume this debt before incrementing.
     */
    fun handlePreviousReel() {
        val maxBacktrack = activeSession?.reelCount ?: 0
        if (backtrackDebt < maxBacktrack) {
            backtrackDebt++
            android.util.Log.d("SessionManager", "Scrolled back: backtrackDebt=$backtrackDebt / max=$maxBacktrack")
        }
    }

    /**
     * Called when user scrolls forward to the next reel.
     * If user had backtracked, uses up 1 backtrack count without incrementing the main counter.
     * Otherwise increments the session count.
     * Returns true if main counter incremented, false if backtrack debt was consumed.
     */
    suspend fun handleNextReel(): Boolean {
        if (backtrackDebt > 0) {
            backtrackDebt--
            android.util.Log.d("SessionManager", "Re-watching reel: remaining backtrackDebt=$backtrackDebt")
            return false
        }
        incrementCount()
        return true
    }

    /**
     * Finalize the active session immediately when Instagram is closed or backgrounded.
     * Resets activeSession to null so the next session starts from 0.
     */
    fun endSession(reason: EndReason = EndReason.BACKGROUNDED) {
        val session = activeSession ?: return
        activeSession = null
        backtrackDebt = 0

        scope.launch(Dispatchers.IO) {
            val endTime = System.currentTimeMillis()
            if (session.reelCount == 0) {
                repo.finalizeSession(session.dbId, endTime, EndReason.EMPTY.value)
            } else {
                repo.finalizeSession(session.dbId, endTime, reason.value)
            }
        }
    }

    suspend fun finalizeActiveSession(reason: EndReason) {
        val session = activeSession ?: return
        activeSession = null
        val endTime = System.currentTimeMillis()
        if (session.reelCount == 0) {
            repo.finalizeSession(session.dbId, endTime, EndReason.EMPTY.value)
        } else {
            repo.finalizeSession(session.dbId, endTime, reason.value)
        }
    }
}
