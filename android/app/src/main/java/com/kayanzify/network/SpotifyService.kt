package com.kayanzify.network

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Query

// Minimal models

@JsonClass(generateAdapter = true)
data class ProfileResponse(
    @Json(name = "display_name") val displayName: String?,
    val email: String?
)

@JsonClass(generateAdapter = true)
data class TrackItem(
    val id: String,
    val name: String,
    @Json(name = "artists") val artists: List<ArtistSummary>,
    @Json(name = "album") val album: AlbumSummary?
)

@JsonClass(generateAdapter = true)
data class ArtistSummary(
    val name: String
)

@JsonClass(generateAdapter = true)
data class AlbumSummary(
    @Json(name = "images") val images: List<Image>?
)

@JsonClass(generateAdapter = true)
data class Image(
    val url: String
)

@JsonClass(generateAdapter = true)
data class TopTracksResponse(
    val items: List<TrackItem>
)

@JsonClass(generateAdapter = true)
data class ArtistItem(
    val id: String,
    val name: String,
    @Json(name = "images") val images: List<Image>?
)

@JsonClass(generateAdapter = true)
data class TopArtistsResponse(
    val items: List<ArtistItem>
)

interface SpotifyService {
    @GET("v1/me")
    suspend fun getProfile(@Header("Authorization") auth: String): Response<ProfileResponse>

    @GET("v1/me/top/tracks")
    suspend fun getTopTracks(
        @Header("Authorization") auth: String,
        @Query("time_range") range: String,
        @Query("limit") limit: Int = 20
    ): Response<TopTracksResponse>

    @GET("v1/me/top/artists")
    suspend fun getTopArtists(
        @Header("Authorization") auth: String,
        @Query("time_range") range: String,
        @Query("limit") limit: Int = 20
    ): Response<TopArtistsResponse>
}
