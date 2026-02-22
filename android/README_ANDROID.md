# Kayanzify Android Starter

This folder contains a **native Android starter scaffold** (Kotlin + Jetpack Compose) for learning app development by rebuilding your current Spotify project.

## What is included

- Compose app shell
- Tabs: Profile, Songs, Artists, Albums
- Time-range chips
- Starter buttons for Login + Load Data
- Deep-link intent filter for future Spotify callback (`kayanzify://auth-callback`)

## Open in Android Studio

1. Open Android Studio
2. Choose **Open**
3. Select this folder: `android/`
4. Let Gradle sync
5. Run on emulator/device

## Spotify setup for later (Week 2+)

In Spotify Dashboard, add redirect URI:

- `kayanzify://auth-callback`

## Next coding steps

1. Add PKCE auth flow in app
2. Save token using DataStore
3. Add Retrofit Spotify client
4. Wire endpoints:

   - `/v1/me`
   - `/v1/me/top/tracks`
   - `/v1/me/top/artists`

See learning roadmap: `../ANDROID_LEARNING_PLAN.md`
