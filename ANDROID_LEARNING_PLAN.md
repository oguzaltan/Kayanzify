# Kayanzify Android Learning Plan (4 Weeks)

## Goal
Rebuild the current Spotify web app as a native Android app using **Kotlin + Jetpack Compose**, while learning core Android concepts.

## Week 1 — Android + Compose Fundamentals

### Learning goals
- Android project structure
- Activity lifecycle basics
- Compose UI fundamentals (`@Composable`, `State`, `Scaffold`, `LazyColumn`)
- Navigation basics

### Build goals
- Run the starter app
- Create tabs: Profile, Songs, Artists, Albums
- Add a time-range selector UI (mock only)
- Use mock data for all tabs

### Deliverable
A running Android app with the same screen structure as Kayanzify, but no API yet.

---

## Week 2 — Spotify Auth (PKCE)

### Learning goals
- OAuth 2.0 PKCE in mobile apps
- Deep links / app links
- Secure token storage (DataStore)

### Build goals
- Add Spotify login button
- Open Spotify authorize URL in browser
- Handle redirect back into app
- Exchange code for access token

### Deliverable
User can sign in and app stores access token.

---

## Week 3 — Spotify API + Real Data

### Learning goals
- Retrofit + OkHttp
- Coroutines + `suspend` + `ViewModel`
- UI state (`Loading`, `Success`, `Error`)

### Build goals
- Fetch profile (`/v1/me`)
- Fetch top tracks/artists
- Build top albums from track albums
- Bind data into existing tabs

### Deliverable
Android app shows real Spotify profile and top lists.

---

## Week 4 — Polish + Packaging

### Learning goals
- Error handling and retry patterns
- Material 3 theming
- Release build basics

### Build goals
- Add loading placeholders and friendly errors
- Add dark theme toggle
- Basic caching for last successful response
- Build debug APK

### Deliverable
Usable Android MVP version of Kayanzify.

---

## Suggested Daily Routine (60–90 min)
- 20 min concept learning
- 40 min implementation
- 10 min refactor + notes
- 10 min recap: “What I learned today”

## What to keep from current web app
- Product flow (tabs + time range + profile)
- Spotify endpoint choices
- PKCE auth understanding

## What changes in Android
- UI stack: Compose instead of HTML/CSS
- State handling: ViewModel state instead of mutable globals
- Navigation/deep-link setup in Android Manifest
- Persistent storage via DataStore instead of localStorage
