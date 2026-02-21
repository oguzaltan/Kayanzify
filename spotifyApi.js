import { ALBUM_SOURCE_TRACK_LIMIT, TOP_LIMIT } from "./config.js";

export async function fetchProfile(token, apiMe) {
  return fetchTopData(token, apiMe, "Profile request failed.");
}

export async function fetchTop10Bundle({
  token,
  timeRange,
  apiTopTracksBase,
  apiTopArtistsBase,
  apiArtistsBase,
  apiAlbumsBase,
}) {
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

  const { items: enrichedArtistItems, debug: artistDebug } = await enrichArtistsData(
    token,
    artistsData,
    apiArtistsBase
  );

  const topSongs = mapTopSongs(tracksData);
  const topArtists = mapTopArtists({ items: enrichedArtistItems });
  let topAlbums = mapTopAlbums(albumsData);
  if (!topAlbums.length) {
    topAlbums = mapTopAlbumsFromTracks(tracksData);
  }

  return { topSongs, topArtists, topAlbums, artistDebug };
}

async function enrichArtistsData(token, artistsData, apiArtistsBase) {
  const baseItems = (artistsData.items || []).slice(0, TOP_LIMIT);
  const ids = baseItems.map((artist) => artist.id).filter(Boolean);

  if (!ids.length || !apiArtistsBase) {
    return {
      items: baseItems,
      debug: {
        attempted: ids.length,
        succeeded: 0,
        failed: 0,
        withFollowers: 0,
        withGenres: 0,
        reason: "No artist IDs or artists endpoint missing",
      },
    };
  }

  try {
    const detailResults = await Promise.allSettled(
      ids.map((id) =>
        fetchTopData(token, `${apiArtistsBase}/${id}`, `Artist details request failed for ${id}.`)
      )
    );

    const fulfilled = detailResults.filter((result) => result.status === "fulfilled");
    const rejected = detailResults.filter((result) => result.status === "rejected");
    let detailsById = new Map(
      fulfilled
        .filter((result) => result.value?.id)
        .map((result) => [result.value.id, result.value])
    );

    let source = "single";

    let mergedItems = mergeArtistDetails(baseItems, detailsById);
    let withFollowers = mergedItems.filter(
      (artist) => typeof artist.followers?.total === "number" || typeof artist.followers === "number"
    ).length;
    let withGenres = mergedItems.filter((artist) => Array.isArray(artist.genres) && artist.genres.length > 0).length;

    if ((withFollowers === 0 || withGenres === 0) && ids.length) {
      try {
        const severalData = await fetchTopData(
          token,
          `${apiArtistsBase}?ids=${ids.join(",")}`,
          "Get several artists request failed."
        );
        const severalById = new Map((severalData.artists || []).map((artist) => [artist.id, artist]));
        const mergedFromSeveral = mergeArtistDetails(baseItems, severalById);
        const severalFollowers = mergedFromSeveral.filter(
          (artist) => typeof artist.followers?.total === "number" || typeof artist.followers === "number"
        ).length;
        const severalGenres = mergedFromSeveral.filter(
          (artist) => Array.isArray(artist.genres) && artist.genres.length > 0
        ).length;

        if (severalFollowers > withFollowers || severalGenres > withGenres) {
          detailsById = severalById;
          mergedItems = mergedFromSeveral;
          withFollowers = severalFollowers;
          withGenres = severalGenres;
          source = "several";
        }
      } catch {
      }
    }

    return {
      items: mergedItems,
      debug: {
        attempted: ids.length,
        succeeded: fulfilled.length,
        failed: rejected.length,
        withFollowers,
        withGenres,
        source,
        reason: rejected.length ? String(rejected[0].reason?.message || rejected[0].reason || "Unknown") : "",
      },
    };
  } catch {
    return {
      items: baseItems,
      debug: {
        attempted: ids.length,
        succeeded: 0,
        failed: ids.length,
        withFollowers: 0,
        withGenres: 0,
        reason: "Artist enrichment failed before individual responses",
      },
    };
  }
}

function mergeArtistDetails(baseItems, detailsById) {
  return baseItems.map((artist) => {
    const details = detailsById.get(artist.id);
    if (!details) return artist;

    return {
      ...artist,
      followers: details.followers || artist.followers,
      genres: (details.genres && details.genres.length ? details.genres : artist.genres) || [],
      external_urls: details.external_urls || artist.external_urls,
      images: (details.images && details.images.length ? details.images : artist.images) || [],
    };
  });
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
    followers: artist.followers?.total,
    genres: (artist.genres || []).slice(0, 3),
    spotifyUrl: artist.external_urls?.spotify || "",
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
