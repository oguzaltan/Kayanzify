import {
  API_ALBUMS_BASE,
  API_ME,
  API_TOP_ARTISTS_BASE,
  API_TOP_TRACKS_BASE,
  AUTH_ENDPOINT,
  CLIENT_ID,
  REDIRECT_URI,
  SCOPES,
  TOKEN_ENDPOINT,
} from "./config.js";
import {
  clearAuthQueryParams,
  clearStoredAuth,
  exchangeCodeForToken,
  getStoredAuthState,
  getStoredToken,
  startLogin,
} from "./auth.js";
import { fetchProfile, fetchTop10Bundle } from "./spotifyApi.js";
import { formatDuration, formatNumber, formatReleaseDate, escapeHtml } from "./utils.js";
import { initTheme, toggleTheme } from "./theme.js";

const loginBtn = document.getElementById("loginBtn");
const meBtn = document.getElementById("meBtn");
const logoutBtn = document.getElementById("logoutBtn");
const themeBtn = document.getElementById("themeBtn");
const timeRangeSelect = document.getElementById("timeRangeSelect");
const resultsControlsEl = document.getElementById("resultsControls");
const resultsTabsEl = document.getElementById("resultsTabs");
const songsTabBtn = document.getElementById("songsTabBtn");
const artistsTabBtn = document.getElementById("artistsTabBtn");
const albumsTabBtn = document.getElementById("albumsTabBtn");
const statusEl = document.getElementById("status");
const outputEl = document.getElementById("output");

let songsResult = null;
let artistsResult = null;
let albumsResult = null;
let activeResultsTab = "songs";
let lastProfileData = null;
let loadedTopTimeRange = null;
let isLoadingTopData = false;

onClick(loginBtn, () =>
  startLogin({
    clientId: CLIENT_ID,
    redirectUri: REDIRECT_URI,
    scopes: SCOPES,
    authEndpoint: AUTH_ENDPOINT,
    setStatus,
  })
);
onClick(meBtn, loadProfile);
onClick(logoutBtn, logout);
onClick(themeBtn, () => toggleTheme(themeBtn));
onClick(songsTabBtn, () => setActiveResultsTab("songs"));
onClick(artistsTabBtn, () => setActiveResultsTab("artists"));
onClick(albumsTabBtn, () => setActiveResultsTab("albums"));

init();

async function init() {
  initTheme(themeBtn);
  setAuthButtonState(false);

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const storedState = getStoredAuthState();

  if (code) {
    if (!state || state !== storedState) {
      setStatus("State mismatch. Please login again.");
      return;
    }

    try {
      await exchangeCodeForToken({
        code,
        clientId: CLIENT_ID,
        redirectUri: REDIRECT_URI,
        tokenEndpoint: TOKEN_ENDPOINT,
      });
      clearAuthQueryParams();
      setStatus("Logged in. Open Profile or use tabs.");
      setAuthButtonState(true);
      showResultsTabs();
    } catch (error) {
      setStatus(`Token exchange failed: ${error.message}`);
      console.error(error);
      setAuthButtonState(false);
    }
    return;
  }

  const token = getStoredToken();
  if (token) {
    setStatus("Token found. Open Profile or use tabs.");
    setAuthButtonState(true);
    showResultsTabs();
  }
}

async function loadProfile() {
  const token = getStoredToken();
  if (!token) {
    setStatus("No token. Login first.");
    return;
  }

  setStatus("Loading profile...");
  renderProfileLoading();

  try {
    const profile = await fetchProfile(token, API_ME);
    lastProfileData = profile;
    renderProfile(profile, new Date());
    setStatus(`Hello, ${profile.display_name || profile.id}`);
  } catch (error) {
    if (error?.status === 401) {
      setStatus("Token expired/invalid. Login again.");
      logout();
      return;
    }

    setStatus(`API failed: ${error?.status || "error"}`);
    renderError(error?.message || "Something went wrong.");
  }
}

async function loadTop10() {
  if (isLoadingTopData) return;

  const token = getStoredToken();
  if (!token) {
    setStatus("No token. Login first.");
    return;
  }

  const timeRange = getSelectedTimeRange();
  const timeRangeLabel = getTimeRangeLabel(timeRange);

  isLoadingTopData = true;
  setStatus(`Loading top 10 songs, artists, and albums (${timeRangeLabel})...`);

  try {
    const { topSongs, topArtists, topAlbums } = await fetchTop10Bundle({
      token,
      timeRange,
      apiTopTracksBase: API_TOP_TRACKS_BASE,
      apiTopArtistsBase: API_TOP_ARTISTS_BASE,
      apiAlbumsBase: API_ALBUMS_BASE,
    });

    songsResult = { items: topSongs, timeRangeLabel };
    artistsResult = { items: topArtists, timeRangeLabel };
    albumsResult = { items: topAlbums, timeRangeLabel };
    loadedTopTimeRange = timeRange;
    activeResultsTab = "songs";
    renderResultsTab();
    setStatus(`Loaded top 10 songs, artists, and albums (${timeRangeLabel}).`);
  } catch (error) {
    if (error?.status === 401) {
      setStatus("Token expired/invalid. Login again.");
      logout();
      return;
    }

    if (error?.status === 403) {
      setStatus("Forbidden (403). Log out and login again to refresh permissions.");
      renderError("Spotify returned 403 Forbidden. Please log out, log in again, and approve access.");
      return;
    }

    setStatus(`Top 10 failed: ${error?.status || "error"}`);
    renderError(error?.message || "Something went wrong.");
  } finally {
    isLoadingTopData = false;
  }
}

function getSelectedTimeRange() {
  return timeRangeSelect?.value || "medium_term";
}

function getTimeRangeLabel(timeRange) {
  if (timeRange === "short_term") return "Last 4 weeks";
  if (timeRange === "long_term") return "All time";
  return "Last 6 months";
}

function logout() {
  clearStoredAuth();
  clearAuthQueryParams();
  songsResult = null;
  artistsResult = null;
  albumsResult = null;
  loadedTopTimeRange = null;
  activeResultsTab = "songs";

  setStatus("Logged out");
  hideResultsTabs();
  outputEl.classList.add("muted");
  outputEl.textContent = "Choose an action to load data.";
  setAuthButtonState(false);
}

function setAuthButtonState(isAuthenticated) {
  if (loginBtn) loginBtn.disabled = false;
  if (meBtn) meBtn.disabled = !isAuthenticated;
  if (logoutBtn) logoutBtn.disabled = !isAuthenticated;
  if (timeRangeSelect) timeRangeSelect.disabled = !isAuthenticated;
  if (resultsControlsEl) {
    resultsControlsEl.hidden = !isAuthenticated;
  }
}

function renderProfile(profile, refreshedAt = new Date()) {
  const displayName = escapeHtml(profile.display_name || profile.id || "Unknown");
  const email = profile.email ? escapeHtml(profile.email) : "Not available";
  const country = escapeHtml(profile.country || "Not available");
  const plan = escapeHtml(profile.product || "Not available");
  const userId = escapeHtml(profile.id || "Not available");
  const spotifyUrl = profile.external_urls?.spotify ? escapeHtml(profile.external_urls.spotify) : "";
  const avatarUrl = profile.images?.[0]?.url ? escapeHtml(profile.images[0].url) : "";
  const initial = escapeHtml((profile.display_name || profile.id || "?").slice(0, 1).toUpperCase());
  const refreshedLabel = escapeHtml(
    new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(refreshedAt)
  );

  showResultsTabs();
  outputEl.classList.remove("muted");
  outputEl.innerHTML = `
    <h2 class="result-title">👤 Your Profile</h2>
    <p class="result-subtitle">Basic account details from Spotify · Last refreshed: ${refreshedLabel}</p>
    <div class="profile-hero">
      ${avatarUrl ? `<img class="profile-avatar" src="${avatarUrl}" alt="${displayName} avatar" />` : `<div class="profile-avatar placeholder" aria-hidden="true">${initial}</div>`}
      <div>
        <p class="profile-name">${displayName}</p>
        <div class="profile-links">
          ${spotifyUrl ? `<a href="${spotifyUrl}" target="_blank" rel="noreferrer">Open Spotify Profile</a>` : ""}
          ${profile.email ? `<a href="mailto:${email}">${email}</a>` : `<span class="muted">Email: ${email}</span>`}
        </div>
      </div>
    </div>
    <div class="badges">
      <span class="badge">Plan: ${plan}</span>
      <span class="badge">Country: ${country}</span>
      <span class="badge">User ID: ${userId}</span>
    </div>
    <div class="profile-actions">
      <button id="copyProfileJsonBtn" type="button">Copy Profile JSON</button>
    </div>
  `;

  onClick(document.getElementById("copyProfileJsonBtn"), copyProfileJson);
}

function renderProfileLoading() {
  showResultsTabs();
  outputEl.classList.remove("muted");
  outputEl.innerHTML = `
    <h2 class="result-title">👤 Your Profile</h2>
    <p class="result-subtitle">Loading profile data...</p>
    <div class="profile-hero">
      <div class="skeleton skeleton-avatar"></div>
      <div style="flex: 1;">
        <div class="skeleton skeleton-line" style="width: 45%;"></div>
        <div class="skeleton skeleton-line" style="width: 70%;"></div>
      </div>
    </div>
    <div class="skeleton skeleton-line" style="width: 85%;"></div>
    <div class="skeleton skeleton-line" style="width: 65%;"></div>
  `;
}

async function copyProfileJson() {
  if (!lastProfileData) {
    setStatus("No profile data to copy yet.");
    return;
  }

  const text = JSON.stringify(lastProfileData, null, 2);
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setStatus("Profile JSON copied to clipboard.");
  } catch {
    setStatus("Copy failed. Please try again.");
  }
}

function renderTopSongs(topSongs, timeRangeLabel) {
  const items = topSongs
    .map(
      (song) =>
        `<li><div class="album-row">${song.coverUrl ? `<img class="album-cover" src="${escapeHtml(song.coverUrl)}" alt="${escapeHtml(song.name)} cover" />` : `<div class="album-cover" aria-hidden="true"></div>`}<div><strong>#${song.rank}</strong> ${escapeHtml(song.name)} — ${escapeHtml(song.artists)}<br /><span class="muted">Album: ${escapeHtml(song.album || "Unknown")} · Duration: ${escapeHtml(formatDuration(song.durationMs))}</span></div></div></li>`
    )
    .join("");

  outputEl.classList.remove("muted");
  outputEl.innerHTML = `
    <h2 class="result-title">🎵 Top 10 Songs</h2>
    <p class="result-subtitle">Time range: ${escapeHtml(timeRangeLabel)}</p>
    <ol class="result-list">${items}</ol>
  `;
}

function renderTopArtists(topArtists, timeRangeLabel) {
  const items = topArtists
    .map(
      (artist) =>
        `<li><div class="album-row">${artist.imageUrl ? `<img class="album-cover" src="${escapeHtml(artist.imageUrl)}" alt="${escapeHtml(artist.name)} image" />` : `<div class="album-cover" aria-hidden="true"></div>`}<div><strong>#${artist.rank}</strong> ${escapeHtml(artist.name)}</div></div></li>`
    )
    .join("");

  outputEl.classList.remove("muted");
  outputEl.innerHTML = `
    <h2 class="result-title">🎤 Top 10 Artists</h2>
    <p class="result-subtitle">Time range: ${escapeHtml(timeRangeLabel)}</p>
    <ol class="result-list">${items}</ol>
  `;
}

function renderTopAlbums(topAlbums, timeRangeLabel) {
  if (!topAlbums.length) {
    outputEl.classList.remove("muted");
    outputEl.innerHTML = `
      <h2 class="result-title">💿 Top 10 Albums</h2>
      <p class="result-subtitle">Time range: ${escapeHtml(timeRangeLabel)}</p>
      <p class="muted">Albums data is not available for this request.</p>
    `;
    return;
  }

  const items = topAlbums
    .map(
      (album) =>
        `<li><div class="album-row">${album.coverUrl ? `<img class="album-cover" src="${escapeHtml(album.coverUrl)}" alt="${escapeHtml(album.name)} cover" />` : `<div class="album-cover" aria-hidden="true"></div>`}<div><strong>#${album.rank}</strong> ${escapeHtml(album.name)} — ${escapeHtml(album.artists)}<br /><span class="muted">Release: ${escapeHtml(formatReleaseDate(album.releaseDate))} · Tracks: ${formatNumber(album.totalTracks)}</span></div></div></li>`
    )
    .join("");

  outputEl.classList.remove("muted");
  outputEl.innerHTML = `
    <h2 class="result-title">💿 Top 10 Albums</h2>
    <p class="result-subtitle">Time range: ${escapeHtml(timeRangeLabel)}</p>
    <ol class="result-list">${items}</ol>
  `;
}

function renderResultsTab() {
  showResultsTabs();

  songsTabBtn?.classList.toggle("active", activeResultsTab === "songs");
  artistsTabBtn?.classList.toggle("active", activeResultsTab === "artists");
  albumsTabBtn?.classList.toggle("active", activeResultsTab === "albums");

  if (activeResultsTab === "songs") {
    if (songsResult) {
      renderTopSongs(songsResult.items, songsResult.timeRangeLabel);
    } else {
      renderUnavailable("Songs");
    }
    return;
  }

  if (activeResultsTab === "artists") {
    if (artistsResult) {
      renderTopArtists(artistsResult.items, artistsResult.timeRangeLabel);
    } else {
      renderUnavailable("Artists");
    }
    return;
  }

  if (activeResultsTab === "albums") {
    if (albumsResult) {
      renderTopAlbums(albumsResult.items, albumsResult.timeRangeLabel);
    } else {
      renderUnavailable("Albums");
    }
    return;
  }

  renderUnavailable("Results");
}

function setActiveResultsTab(tabName) {
  activeResultsTab = tabName;
  if (shouldLoadTopData()) {
    loadTop10();
    return;
  }
  renderResultsTab();
}

function shouldLoadTopData() {
  const selectedRange = getSelectedTimeRange();
  const hasData = !!songsResult && !!artistsResult && !!albumsResult;
  if (!hasData) return true;
  return loadedTopTimeRange !== selectedRange;
}

function showResultsTabs() {
  if (!resultsTabsEl) return;
  resultsTabsEl.hidden = false;
}

function hideResultsTabs() {
  if (!resultsTabsEl) return;
  resultsTabsEl.hidden = true;
}

function onClick(element, handler) {
  if (element) element.addEventListener("click", handler);
}

function renderError(errorText) {
  outputEl.classList.add("muted");
  outputEl.textContent = errorText || "Something went wrong.";
}

function renderUnavailable(sectionName) {
  outputEl.classList.add("muted");
  outputEl.textContent = `${sectionName} data is not loaded yet.`;
}

function setStatus(message) {
  statusEl.textContent = message;
}
