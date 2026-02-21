import { ALBUM_SOURCE_TRACK_LIMIT, TOP_LIMIT } from "./config.js";

export async function fetchProfile(token, apiMe) {
  return fetchTopData(token, apiMe, "Profile request failed.");
}

export async function fetchTop10Bundle({ token, timeRange, apiTopTracksBase, apiTopArtistsBase, apiAlbumsBase }) {
  const tracksEndpoint = `${apiTopTracksBase}?limit=${ALBUM_SOURCE_TRACK_LIMIT}&time_range=${timeRange}`;
  const artistsEndpoint = `${apiTopArtistsBase}?limit=${TOP_LIMIT}&time_range=${timeRange}`;

  const [tracksData, artistsData] = await Promise.all([
    fetchTopData(token, tracksEndpoint, "Top tracks request failed."),
    fetchTopData(token, artistsEndpoint, "Top artists request failed."),
  ]);

  const albumIds = getTopAlbumIds(tracksData);
  let albumsData = { albums: [] };

  if (albumIds.length) {
    try {
      albumsData = await fetchTopData(
        token,
        `${apiAlbumsBase}?ids=${albumIds.join(",")}`,
        "Albums request failed."
      );
    } catch {
      albumsData = { albums: [] };
    }
  }

  const topSongs = mapTopSongs(tracksData);
  const topArtists = mapTopArtists(artistsData);
  let topAlbums = mapTopAlbums(albumsData);
  if (!topAlbums.length) {
    topAlbums = mapTopAlbumsFromTracks(tracksData);
  }

  return { topSongs, topArtists, topAlbums };
}

export async function fetchTopData(token, endpoint, fallbackErrorMessage) {
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(errorText || fallbackErrorMessage);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

function mapTopSongs(tracksData) {
  return (tracksData.items || []).slice(0, TOP_LIMIT).map((track, index) => ({
    id: track.id,
    rank: index + 1,
    name: track.name,
    artists: (track.artists || []).map((a) => a.name).join(", "),
    album: track.album?.name,
    durationMs: track.duration_ms,
    coverUrl: track.album?.images?.[2]?.url || track.album?.images?.[1]?.url || track.album?.images?.[0]?.url || "",
  }));
}

function mapTopArtists(artistsData) {
  return (artistsData.items || []).slice(0, TOP_LIMIT).map((artist, index) => ({
    id: artist.id,
    rank: index + 1,
    name: artist.name,
    imageUrl: artist.images?.[2]?.url || artist.images?.[1]?.url || artist.images?.[0]?.url || "",
  }));
}

function getTopAlbumIds(tracksData) {
  const seen = new Set();
  const ids = [];

  for (const track of tracksData.items || []) {
    const albumId = track.album?.id;
    if (!albumId || seen.has(albumId)) continue;
    seen.add(albumId);
    ids.push(albumId);
    if (ids.length === TOP_LIMIT) break;
  }

  return ids;
}

function mapTopAlbums(albumsData) {
  return (albumsData.albums || []).map((album, index) => ({
    rank: index + 1,
    name: album?.name || "Unknown",
    artists: (album?.artists || []).map((a) => a.name).join(", "),
    totalTracks: album?.total_tracks,
    releaseDate: album?.release_date,
    coverUrl: album?.images?.[2]?.url || album?.images?.[1]?.url || album?.images?.[0]?.url || "",
  }));
}

function mapTopAlbumsFromTracks(tracksData) {
  const seen = new Set();
  const albums = [];

  for (const track of tracksData.items || []) {
    const album = track.album;
    const albumId = album?.id || album?.name;
    if (!albumId || seen.has(albumId)) continue;

    seen.add(albumId);
    albums.push({
      rank: albums.length + 1,
      name: album?.name || "Unknown",
      artists: (album?.artists || track.artists || []).map((a) => a.name).join(", "),
      totalTracks: album?.total_tracks,
      releaseDate: album?.release_date,
      coverUrl: album?.images?.[2]?.url || album?.images?.[1]?.url || album?.images?.[0]?.url || "",
    });

    if (albums.length === TOP_LIMIT) break;
  }

  return albums;
}
