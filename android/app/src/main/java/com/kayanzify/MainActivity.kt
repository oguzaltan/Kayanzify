package com.kayanzify

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.kayanzify.ui.KayanzifyApp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleSpotifyIntent(intent)
        val accessToken = SpotifyAuth.getAccessToken(this)
        setContent {
            KayanzifyApp(accessToken)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleSpotifyIntent(intent)
    }

    private fun handleSpotifyIntent(intent: Intent) {
        val data: android.net.Uri? = intent.data
        if (data != null && data.scheme == "kayanzify" && data.host == "auth-callback") {
            val code = data.getQueryParameter("code")
            if (code != null) {
                android.widget.Toast.makeText(this, "Received code: $code", android.widget.Toast.LENGTH_SHORT).show()
                SpotifyAuth.exchangeCodeForToken(this, code) { token ->
                    runOnUiThread {
                        android.widget.Toast.makeText(this, "Token received: ${token?.take(8)}...", android.widget.Toast.LENGTH_SHORT).show()
                        setContent {
                            KayanzifyApp(token)
                        }
                    }
                }
            }
        }
    }
}
