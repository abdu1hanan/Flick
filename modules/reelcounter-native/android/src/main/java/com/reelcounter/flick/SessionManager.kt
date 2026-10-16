package com.reelcounter.flick

import android.content.Context
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

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
 * Manages session lifecycle with grace period support.
 * Writes all session state to Room via ReelRepository.
 */
class SessionManager(
    private val context: Context,
    private val scope: CoroutineScope,
    private val onCountUpdate: (sessionCount: Int, todayCount: Int) -> Unit
) {
    private val repo = ReelRepository(context)
    var activeSession: ActiveSession? = null
        private set

    private var sessionEndJob: Job? = null
    private val GRACE_PERIOD_MS = 3000L

    /** Recover any sessions that were active when the process died. */
    suspend fun recoverOrphanedSessions() {
        val orphans = repo.getOrphanedSessions()
        for (orphan in orphans) {
            if (orphan.reelCount == 0) {
                // Delete zero-count orphans by finalizing with EMPTY reason
                repo.finalizeSession(orphan.id, System.currentTimeMillis(), EndReason.EMPTY.value)
            } else {
                repo.finalizeSession(orphan.id, System.currentTimeMillis(), EndReason.PROCESS_DEATH.value)
            }
        }
    }

    /** Start a new session. */
    fun startSession() {
        sessionEndJob?.cancel()
        sessionEndJob = null

        if (activeSession != null) return // Already active

        scope.launch {
            val now = System.currentTimeMillis()
            val sessionId = repo.insertSession(
                ReelSession(
                    startTime = now,
                    localStartDate = DateUtils.todayLocalDate(),
                    reelCount = 0
                )
            )
            activeSession = ActiveSession(dbId = sessionId, startTime = now, reelCount = 0)
        }
    }

    /**
     * Increment the count for the active session.
     * Returns the new session count, or 0 if no session is active.
     */
    suspend fun incrementCount(): Int {
        val session = activeSession ?: return 0
        session.reelCount++
        repo.incrementSessionCount(session.dbId)

        val now = System.currentTimeMillis()
        val today = DateUtils.todayLocalDate()
        repo.insertEvent(
            ReelEvent(
                sessionId = session.dbId,
                timestamp = now,
                localDate = today,
                detectionSource = "COMBINED"
            )
        )

        val todayCount = repo.getCountForDate(today)
        onCountUpdate(session.reelCount, todayCount)
        return session.reelCount
    }

    /**
     * Schedule session finalization after the grace period.
     * If Instagram regains focus before the grace period ends, this is cancelled.
     */
    fun scheduleSessionEnd(reason: EndReason) {
        sessionEndJob?.cancel()
        sessionEndJob = scope.launch {
            delay(GRACE_PERIOD_MS)
            finalizeActiveSession(reason)
        }
    }

    /** Cancel a pending session end (Instagram regained focus within grace period). */
    fun cancelSessionEnd() {
        sessionEndJob?.cancel()
        sessionEndJob = null
    }

    /** Immediately finalize the active session. */
    suspend fun finalizeActiveSession(reason: EndReason) {
        val session = activeSession ?: return
        activeSession = null
        sessionEndJob?.cancel()
        sessionEndJob = null

        val endTime = System.currentTimeMillis()
        if (session.reelCount == 0) {
            // Don't keep zero-count sessions
            repo.finalizeSession(session.dbId, endTime, EndReason.EMPTY.value)
        } else {
            repo.finalizeSession(session.dbId, endTime, reason.value)
        }
    }
}
