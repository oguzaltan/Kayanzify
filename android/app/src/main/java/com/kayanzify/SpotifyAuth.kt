package com.kayanzify

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Base64
import com.kayanzify.network.TokenDataStore
import java.io.IOException
import java.security.MessageDigest
import java.security.SecureRandom
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.Call
import okhttp3.Callback
import okhttp3.FormBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import org.json.JSONObject

object SpotifyAuth {
    // TODO: Replace with your real client ID and redirect URI
    private const val CLIENT_ID = "5fb2330547334086a6d2b26913734e44"
    private const val REDIRECT_URI = "kayanzify://auth-callback"
    private const val AUTH_ENDPOINT = "https://accounts.spotify.com/authorize"
    private const val TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token"
    private const val CODE_CHALLENGE_METHOD = "S256"
    private const val RESPONSE_TYPE = "code"
    private const val SCOPE = "user-read-private user-read-email user-top-read"

    private var codeVerifier: String? = null

    fun generateCodeVerifier(): String {
        val bytes = ByteArray(32)
        SecureRandom().nextBytes(bytes)
        return Base64.encodeToString(bytes, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
            .replace("=", "")
    }

    fun generateCodeChallenge(verifier: String): String {
        val bytes = verifier.toByteArray(Charsets.US_ASCII)
        val md = MessageDigest.getInstance("SHA-256")
        val digest = md.digest(bytes)
        return Base64.encodeToString(digest, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
            .replace("=", "")
    }

    fun getAuthorizeUrl(codeChallenge: String): String {
        return "$AUTH_ENDPOINT?client_id=$CLIENT_ID" +
                "&response_type=$RESPONSE_TYPE" +
                "&redirect_uri=$REDIRECT_URI" +
                "&code_challenge_method=$CODE_CHALLENGE_METHOD" +
                "&code_challenge=$codeChallenge" +
                "&scope=$SCOPE"
    }

    fun launchAuth(context: Context) {
        val newCodeVerifier = generateCodeVerifier()
        codeVerifier = newCodeVerifier
        // persist verifier in prefs so we can read it later if process died
        context.getSharedPreferences("spotify_prefs", Context.MODE_PRIVATE)
            .edit().putString("code_verifier", newCodeVerifier).apply()
        val codeChallenge = generateCodeChallenge(newCodeVerifier)
        val url = getAuthorizeUrl(codeChallenge)
        android.util.Log.d("SpotifyAuth", "Launching auth url: $url")
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        context.startActivity(intent)
    }

    fun exchangeCodeForToken(context: Context, code: String, onTokenReceived: (String?) -> Unit) {
        var verifier = codeVerifier
        if (verifier == null) {
            // try to restore from prefs
            verifier = context.getSharedPreferences("spotify_prefs", Context.MODE_PRIVATE)
                .getString("code_verifier", null)
        }
        if (verifier == null) {
            onTokenReceived(null)
            return
        }

        val client = OkHttpClient()

        val formBody = FormBody.Builder()
            .add("grant_type", "authorization_code")
            .add("code", code)
            .add("redirect_uri", REDIRECT_URI)
            .add("client_id", CLIENT_ID)
            .add("code_verifier", verifier)
            .build()

        val request = Request.Builder()
            .url(TOKEN_ENDPOINT)
            .post(formBody)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                onTokenReceived(null)
            }

            override fun onResponse(call: Call, response: Response) {
                val responseBody = response.body?.string()
                if (response.isSuccessful && responseBody != null) {
                    val json = JSONObject(responseBody)
                    val accessToken = json.getString("access_token")
                    saveAccessToken(context, accessToken)
                    onTokenReceived(accessToken)
                } else {
                    onTokenReceived(null)
                }
            }
        })
    }

    private fun saveAccessToken(context: Context, token: String) {
        // keep legacy preference for quick synchronous reads
        val sharedPrefs = context.getSharedPreferences("spotify_prefs", Context.MODE_PRIVATE)
        sharedPrefs.edit().putString("access_token", token).apply()
        // also persist via DataStore for modern usage
        CoroutineScope(Dispatchers.IO).launch {
            TokenDataStore.saveToken(context, token)
        }
    }

    fun getAccessToken(context: Context): String? {
        // synchronous fallback; DataStore is used elsewhere for async retrieval
        val sharedPrefs = context.getSharedPreferences("spotify_prefs", Context.MODE_PRIVATE)
        return sharedPrefs.getString("access_token", null)
    }
}
