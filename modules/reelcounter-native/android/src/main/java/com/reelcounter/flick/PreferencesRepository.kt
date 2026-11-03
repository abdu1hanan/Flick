package com.reelcounter.flick

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "reelcounter_prefs")

object PreferencesKeys {
    val ONBOARDING_COMPLETED = booleanPreferencesKey("onboarding_completed")
    val OVERLAY_ENABLED = booleanPreferencesKey("overlay_enabled")
    val ISLAND_THEME = stringPreferencesKey("island_theme")
    val TAP_TO_CYCLE_THEME = booleanPreferencesKey("tap_to_cycle_theme")
    val OVERLAY_X = intPreferencesKey("overlay_x")
    val OVERLAY_Y = intPreferencesKey("overlay_y")
}

class PreferencesRepository(private val context: Context) {

    val overlayEnabled: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[PreferencesKeys.OVERLAY_ENABLED] ?: true // default enabled
    }

    val onboardingCompleted: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[PreferencesKeys.ONBOARDING_COMPLETED] ?: false
    }

    val islandTheme: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[PreferencesKeys.ISLAND_THEME] ?: "classic"
    }

    val tapToCycleTheme: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[PreferencesKeys.TAP_TO_CYCLE_THEME] ?: true
    }

    suspend fun getOverlayEnabled(): Boolean {
        return context.dataStore.data.first()[PreferencesKeys.OVERLAY_ENABLED] ?: true
    }

    suspend fun setOverlayEnabled(enabled: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[PreferencesKeys.OVERLAY_ENABLED] = enabled
        }
    }

    suspend fun getIslandTheme(): String {
        return context.dataStore.data.first()[PreferencesKeys.ISLAND_THEME] ?: "classic"
    }

    suspend fun setIslandTheme(theme: String) {
        context.dataStore.edit { prefs ->
            prefs[PreferencesKeys.ISLAND_THEME] = theme
        }
    }

    suspend fun getTapToCycleTheme(): Boolean {
        return context.dataStore.data.first()[PreferencesKeys.TAP_TO_CYCLE_THEME] ?: true
    }

    suspend fun setTapToCycleTheme(enabled: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[PreferencesKeys.TAP_TO_CYCLE_THEME] = enabled
        }
    }

    suspend fun getOverlayPosition(): Pair<Int, Int> {
        val prefs = context.dataStore.data.first()
        val x = prefs[PreferencesKeys.OVERLAY_X] ?: -1
        val y = prefs[PreferencesKeys.OVERLAY_Y] ?: -1
        return Pair(x, y)
    }

    suspend fun setOverlayPosition(x: Int, y: Int) {
        context.dataStore.edit { prefs ->
            prefs[PreferencesKeys.OVERLAY_X] = x
            prefs[PreferencesKeys.OVERLAY_Y] = y
        }
    }

    suspend fun setOnboardingCompleted(completed: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[PreferencesKeys.ONBOARDING_COMPLETED] = completed
        }
    }
}
