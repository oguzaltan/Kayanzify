package com.kayanzify.network

import android.content.Context
import android.util.Log
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.flow.firstOrNull
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory

class SpotifyRepository(private val context: Context) {
    private val service: SpotifyService

    init {
        val moshi = Moshi.Builder()
            .add(KotlinJsonAdapterFactory())
            .build()
        val retrofit = Retrofit.Builder()
            .baseUrl("https://api.spotify.com/")
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
        service = retrofit.create(SpotifyService::class.java)
    }

    private suspend fun authHeader(): String? {
        val tokenFlow = TokenDataStore.getToken(context)
        val token = tokenFlow.firstOrNull()
        return token?.let { "Bearer $it" }
    }

    suspend fun getProfile(): ProfileResponse? {
        val header = authHeader() ?: return null
        val resp = service.getProfile(header)
        return if (resp.isSuccessful) resp.body() else null
    }

    suspend fun getTopTracks(range: String, limit: Int): List<TrackItem> {
        Log.d("SpotifyRepository", "getTopTracks with range: $range, limit: $limit")
        val header = authHeader() ?: return emptyList()
        val resp = service.getTopTracks(header, range, limit)
        return if (resp.isSuccessful) resp.body()?.items ?: emptyList() else emptyList()
    }

    suspend fun getTopArtists(range: String, limit: Int): List<ArtistItem> {
        Log.d("SpotifyRepository", "getTopArtists with range: $range, limit: $limit")
        val header = authHeader() ?: return emptyList()
        val resp = service.getTopArtists(header, range, limit)
        return if (resp.isSuccessful) resp.body()?.items ?: emptyList() else emptyList()
    }

    suspend fun getTopAlbums(range: String, limit: Int): List<AlbumSummary> {
        Log.d("SpotifyRepository", "getTopAlbums with range: $range, limit: $limit")
        val tracks = getTopTracks(range, 50) // fetch more tracks to find unique albums
        // The API may return tracks without album info, or duplicate albums for tracks on the same album.
        return tracks.mapNotNull { it.album }.distinctBy { it.name }.take(limit)
    }
}
