package com.kayanzify

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import com.kayanzify.ui.KayanzifyApp

class MainActivity : ComponentActivity() {
    private val vm: SpotifyViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleSpotifyIntent(intent)
        setContent {
            KayanzifyApp(vm)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleSpotifyIntent(intent)
    }

    private fun handleSpotifyIntent(intent: Intent) {
        val data: android.net.Uri? = intent.data
        android.widget.Toast.makeText(this, "Intent data: $data", android.widget.Toast.LENGTH_SHORT).show()
        if (data != null && data.scheme == "kayanzify" && data.host == "auth-callback") {
            val code = data.getQueryParameter("code")
            val error = data.getQueryParameter("error")
            android.widget.Toast.makeText(this, "code=$code error=$error", android.widget.Toast.LENGTH_SHORT).show()
            if (code != null) {
                SpotifyAuth.exchangeCodeForToken(this, code) { token ->
                    runOnUiThread {
                        android.widget.Toast.makeText(this, "Token received: ${token?.take(8)}...", android.widget.Toast.LENGTH_SHORT).show()
                        if (token != null) {
                            vm.onNewToken(token)
                        }
                    }
                }
            }
        }
    }
}
