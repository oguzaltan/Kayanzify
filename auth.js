import { createCodeChallenge, randomString } from "./utils.js";

const ACCESS_TOKEN_KEY = "spotify_access_token";
const CODE_VERIFIER_KEY = "spotify_code_verifier";
const AUTH_STATE_KEY = "spotify_auth_state";

export async function startLogin({ clientId, redirectUri, scopes, authEndpoint, setStatus }) {
  if (!clientId || clientId.includes("PASTE_")) {
     setStatus("Please set your Spotify Client ID in config.js");
    return;
  }

  const state = randomString(16);
  const codeVerifier = randomString(64);
  const codeChallenge = await createCodeChallenge(codeVerifier);

  localStorage.setItem(AUTH_STATE_KEY, state);
  localStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
    state,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    show_dialog: "true",
  });

  window.location.href = `${authEndpoint}?${params.toString()}`;
}

export async function exchangeCodeForToken({ code, clientId, redirectUri, tokenEndpoint }) {
  const codeVerifier = localStorage.getItem(CODE_VERIFIER_KEY);
  if (!codeVerifier) throw new Error("Missing code verifier");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status} ${errorText}`);
  }

  const tokenData = await response.json();
  localStorage.setItem(ACCESS_TOKEN_KEY, tokenData.access_token);
}

export function getStoredToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredAuthState() {
  return localStorage.getItem(AUTH_STATE_KEY);
}

export function clearStoredAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(CODE_VERIFIER_KEY);
  localStorage.removeItem(AUTH_STATE_KEY);
}

export function clearAuthQueryParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  window.history.replaceState({}, document.title, url.pathname + url.search);
}
