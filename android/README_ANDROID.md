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

- `kayanzify://auth-callback` (custom scheme) or later migrate to an HTTPS App Link.

> **Note:** when using a custom scheme the browser will not automatically close
> after authorization. You may need to tap "Open in Kayanzify" or press Back
> manually. This is normal behavior for most mobile browsers.

## Current status

This starter now includes a fully working Spotify integration:

- ✅ PKCE auth flow with custom scheme redirect
- ✅ Token persistence via DataStore (legacy prefs still used for sync reads)
- ✅ Retrofit service & repository for Spotify APIs
- ✅ Profile, Top Songs and Top Artists tabs displaying real user data
- ✅ Time-range selector and refresh button driving network requests

> The app receives the callback intent successfully; browser behaviour is
> beyond the app's control (see note above).

### What's next

1. Display album/track/artists images and extra metadata
2. Add logout and handle token expiry/refresh
3. Add loading/error UI states and optional dark theme
4. Cache results or support offline usage
5. Prepare debug/release APK for distribution

See learning roadmap: `../ANDROID_LEARNING_PLAN.md`
