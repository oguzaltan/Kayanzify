package com.kayanzify.network

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "spotify_prefs")

object TokenDataStore {
    private val TOKEN_KEY = stringPreferencesKey("access_token")

    fun getToken(context: Context): Flow<String?> {
        return context.dataStore.data.map {
            it[TOKEN_KEY]
        }
    }

    suspend fun saveToken(context: Context, token: String) {
        context.dataStore.edit {
            it[TOKEN_KEY] = token
        }
    }
}
