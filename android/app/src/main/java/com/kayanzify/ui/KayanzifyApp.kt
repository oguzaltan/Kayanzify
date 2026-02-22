package com.kayanzify.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

enum class KayanzifyTab(val title: String) {
    PROFILE("Profile"),
    SONGS("Songs"),
    ARTISTS("Artists"),
    ALBUMS("Albums")
}

enum class TimeRange(val label: String) {
    SHORT("Last 4 weeks"),
    MEDIUM("Last 6 months"),
    LONG("All time")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KayanzifyApp(accessToken: String? = null) {
    var selectedTab by remember { mutableStateOf(KayanzifyTab.PROFILE) }
    var selectedRange by remember { mutableStateOf(TimeRange.MEDIUM) }

    MaterialTheme {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Kayanzify Android") }
                )
            }
        ) { innerPadding ->
            val context = androidx.compose.ui.platform.LocalContext.current
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(onClick = {
                        com.kayanzify.SpotifyAuth.launchAuth(context)
                    }) {
                        Text("Login with Spotify")
                    }
                    Button(onClick = { /* Load profile/api: Week 3 */ }) {
                        Text("Load Data")
                    }
                }

                Text(
                    text = "Time Range",
                    style = MaterialTheme.typography.titleSmall,
                    modifier = Modifier.padding(top = 16.dp, bottom = 8.dp)
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TimeRange.entries.forEach { range ->
                        FilterChip(
                            selected = selectedRange == range,
                            onClick = { selectedRange = range },
                            label = { Text(range.label) }
                        )
                    }
                }

                TabRow(
                    selectedTabIndex = selectedTab.ordinal,
                    modifier = Modifier.padding(top = 16.dp)
                ) {
                    KayanzifyTab.entries.forEach { tab ->
                        Tab(
                            selected = selectedTab == tab,
                            onClick = { selectedTab = tab },
                            text = { Text(tab.title) }
                        )
                    }
                }

                when (selectedTab) {
                    KayanzifyTab.PROFILE -> ProfileScreen(accessToken)
                    KayanzifyTab.SONGS -> SimpleListScreen(title = "Top Songs")
                    KayanzifyTab.ARTISTS -> SimpleListScreen(title = "Top Artists")
                    KayanzifyTab.ALBUMS -> SimpleListScreen(title = "Top Albums")
                }
            }
        }
    }
}

@Composable
private fun ProfileScreen(accessToken: String?) {
    Column(modifier = Modifier.padding(top = 16.dp)) {
        Text("Profile", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        if (accessToken == null) {
            Text("Not logged in.")
        } else {
            // Fetch and display profile data
            val profile = remember { mutableStateOf<String?>(null) }
            androidx.compose.runtime.LaunchedEffect(accessToken) {
                try {
                    val result = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
                        val client = okhttp3.OkHttpClient()
                        val req = okhttp3.Request.Builder()
                            .url("https://api.spotify.com/v1/me")
                            .addHeader("Authorization", "Bearer $accessToken")
                            .build()
                        val resp = client.newCall(req).execute()
                        val body = resp.body?.string()
                        Pair(resp.code, body)
                    }
                    val (code, body) = result
                    if (code in 200..299 && body != null) {
                        val json = org.json.JSONObject(body)
                        val name = json.optString("display_name", "?")
                        val email = json.optString("email", "?")
                        profile.value = "Name: $name\nEmail: $email"
                    } else {
                        profile.value = "Failed to load profile ($code) \nbody=${body ?: "<null>"}"
                    }
                } catch (e: Exception) {
                    profile.value = "Error: ${e.message ?: e.toString()}"
                }
            }
            Text(profile.value ?: "Loading profile...")
        }
    }
}

@Composable
private fun SimpleListScreen(title: String) {
    val mockItems = listOf(
        "#1 Example Item",
        "#2 Example Item",
        "#3 Example Item",
        "#4 Example Item"
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(top = 16.dp),
        contentPadding = PaddingValues(bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item {
            Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text("Mock data for learning UI first.")
        }
        items(mockItems) { item ->
            Text(item)
        }
    }
}
