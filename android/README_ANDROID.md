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

- ✅ PKCE auth flow implemented
- ✅ Token persistence using DataStore (plus backward-compatible SharedPreferences)
- ✅ Retrofit Spotify client and repository added
- ✅ Real API wired for `/v1/me`, `/v1/me/top/tracks`, `/v1/me/top/artists`

To continue:

1. Display album/track images and additional details
2. Implement logout/refresh and token expiration handling
3. Explore more Spotify endpoints or polish UI

See learning roadmap: `../ANDROID_LEARNING_PLAN.md`
