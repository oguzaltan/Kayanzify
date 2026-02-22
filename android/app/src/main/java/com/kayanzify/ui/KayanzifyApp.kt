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
import androidx.compose.runtime.collectAsState
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
fun KayanzifyApp(vm: com.kayanzify.SpotifyViewModel) {
    var selectedTab by remember { mutableStateOf(KayanzifyTab.PROFILE) }

    // collect state from viewmodel
    val selectedRange by vm.timeRange.collectAsState()
    val profileText by vm.profile.collectAsState()
    val tracks by vm.topTracks.collectAsState()
    val artists by vm.topArtists.collectAsState()
    val token by vm.accessToken.collectAsState()

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
                    if (token == null) {
                        Button(onClick = {
                            com.kayanzify.SpotifyAuth.launchAuth(context)
                        }) {
                            Text("Login with Spotify")
                        }
                    }
                    Button(onClick = { vm.refreshTopData() }) {
                        Text("Refresh")
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
                            selected = selectedRange == range.label,
                            onClick = { vm.setTimeRange(range.label) },
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
                    KayanzifyTab.PROFILE -> ProfileScreen(profileText)
                    KayanzifyTab.SONGS -> ItemListScreen(title = "Top Songs", items = tracks.map { it.name })
                    KayanzifyTab.ARTISTS -> ItemListScreen(title = "Top Artists", items = artists.map { it.name })
                    KayanzifyTab.ALBUMS -> ItemListScreen(title = "Top Albums", items = emptyList())
                }
            }
        }
    }
}

@Composable
private fun ProfileScreen(profileText: String?) {
    Column(modifier = Modifier.padding(top = 16.dp)) {
        Text("Profile", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        if (profileText == null) {
            Text("Not logged in.")
        } else {
            Text(profileText)
        }
    }
}

@Composable
private fun ItemListScreen(title: String, items: List<String>) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(top = 16.dp),
        contentPadding = PaddingValues(bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item {
            Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            if (items.isEmpty()) {
                Text("No data.")
            }
        }
        items(items) { item ->
            Text(item)
        }
    }
}
