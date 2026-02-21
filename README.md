# Spotify Minimal Demo

This is a very small frontend-only example that demonstrates Spotify OAuth (Authorization Code + PKCE) and a minimal Spotify Web API UI.

Current features:

- Login with Spotify
- View your profile (`GET /v1/me`)
- Switch between Songs, Artists, and Albums tabs (auto-loads Top 10 for selected time range)
- Albums tab uses Spotify albums data (cover image + release date)
- Change time range (`short_term`, `medium_term`, `long_term`)

## 1) Spotify Dashboard setup

In your Spotify app settings, add this Redirect URI exactly:

- `http://127.0.0.1:5500`

## 2) Set your Client ID

Open `config.js` and set:

- `export const CLIENT_ID = "..."`

## 3) Run locally (any static server)

### Option A: VS Code Live Server

- Open `index.html`
- Start Live Server
- URL should be: `http://127.0.0.1:5500`

### Option B: Python static server

From this folder run:

```bash
python -m http.server 5500 --bind 127.0.0.1
```

Then open:

- `http://127.0.0.1:5500`

## Project structure

- `index.html` — Minimal UI (buttons, tabs, time-range dropdown, output panel)
- `main.js` — App orchestration, UI state, and rendering
- `config.js` — Spotify app constants and endpoints
- `auth.js` — PKCE login flow and token exchange
- `spotifyApi.js` — Spotify API fetch + mapping helpers
- `theme.js` — Light/dark mode behavior
- `utils.js` — Shared formatting and utility helpers
- `README.md` — Setup and usage guide

## Cleanup notes

- Legacy monolithic file (`app.js`) has been removed.
- Tab handling now uses explicit button listeners only (no legacy fallback IDs).
- Visibility is controlled via the `hidden` attribute for results sections.

## 4) Test flow

- Click **Login with Spotify**
- Approve access
- Choose a time range: **Last 4 weeks**, **Last 6 months**, or **All time**
- Back on app, click **Get My Profile** or open **Songs / Artists / Albums** tabs
- Tabs load and show top data for the selected time range

You should see a simple UI panel (not raw JSON):

- Profile details card
- Top 10 Songs list
- Top 10 Artists list
- Top 10 Albums list

## Common errors

- `redirect_uri_mismatch`
  - Ensure Spotify Dashboard redirect URI exactly matches `REDIRECT_URI` in `config.js`
  - For this project, use `http://127.0.0.1:5500`

- `401 Unauthorized`
  - Access token is expired/invalid
  - Log out and login again

- `403 Forbidden`
  - Missing required scope or stale consent
  - Confirm `user-top-read` is present in `SCOPES`, then log out and login again

- Empty top results
  - Your account may not have enough recent listening history for the selected time range
  - Try another range (`short_term`, `medium_term`, `long_term`)

---

If you later want playlist features, add scopes (for example `playlist-read-private`) in `SCOPES` inside `config.js`.
