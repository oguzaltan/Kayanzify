package com.kayanzify

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.kayanzify.network.SpotifyRepository
import com.kayanzify.network.TokenDataStore
import com.kayanzify.network.TrackItem
import com.kayanzify.network.ArtistItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch

class SpotifyViewModel(application: Application) : AndroidViewModel(application) {
    private val repo = SpotifyRepository(application.applicationContext)

    private val _profile = MutableStateFlow<String?>(null)
    val profile: StateFlow<String?> = _profile

    private val _topTracks = MutableStateFlow<List<TrackItem>>(emptyList())
    val topTracks: StateFlow<List<TrackItem>> = _topTracks

    private val _topArtists = MutableStateFlow<List<ArtistItem>>(emptyList())
    val topArtists: StateFlow<List<ArtistItem>> = _topArtists

    private val _accessToken = MutableStateFlow<String?>(null)
    val accessToken: StateFlow<String?> = _accessToken

    private val _timeRange = MutableStateFlow("medium")
    val timeRange: StateFlow<String> = _timeRange

    init {
        // load existing token
        viewModelScope.launch {
            val token = TokenDataStore.getToken(application.applicationContext).firstOrNull()
            _accessToken.value = token
            if (token != null) loadProfile()
        }
    }

    fun setTimeRange(range: String) {
        _timeRange.value = range
        refreshTopData()
    }

    fun refreshTopData() {
        viewModelScope.launch {
            val range = _timeRange.value
            _topTracks.value = repo.getTopTracks(range)
            _topArtists.value = repo.getTopArtists(range)
        }
    }

    fun loadProfile() {
        viewModelScope.launch {
            val p = repo.getProfile()
            _profile.value = if (p != null) "Name: ${p.displayName}\nEmail: ${p.email}" else "Failed"
        }
    }

    fun onNewToken(token: String) {
        viewModelScope.launch {
            _accessToken.value = token
            _profile.value = null
            repo.getProfile()?.let { p ->
                _profile.value = "Name: ${p.displayName}\nEmail: ${p.email}"
            }
            refreshTopData()
        }
    }
}
