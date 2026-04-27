// Spotify Web API helpers using Client Credentials flow.
// No user login needed — we can search for tracks and artists, but not play
// full songs or modify user data. That's enough for our recommendation use case.

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  // Reuse the cached token if it has at least 60 seconds left.
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Spotify auth failed: ${response.status}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

// Look up a single track by title + artist. Returns null if no match.
export async function searchTrack(title, artist) {
  try {
    const token = await getAccessToken();
    const query = encodeURIComponent(`track:"${title}" artist:"${artist}"`);
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (!response.ok) return null;

    const data = await response.json();
    const track = data.tracks?.items?.[0];
    if (!track) {
      // Fall back to a looser search if the strict one missed.
      return searchTrackLoose(title, artist, token);
    }

    return {
      spotify_id: track.id,
      spotify_url: track.external_urls.spotify,
      preview_url: track.preview_url,
      album_image: track.album?.images?.[track.album.images.length - 1]?.url || null,
      album_image_large: track.album?.images?.[0]?.url || null,
    };
  } catch {
    return null;
  }
}

async function searchTrackLoose(title, artist, token) {
  try {
    const query = encodeURIComponent(`${title} ${artist}`);
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    const track = data.tracks?.items?.[0];
    if (!track) return null;
    return {
      spotify_id: track.id,
      spotify_url: track.external_urls.spotify,
      preview_url: track.preview_url,
      album_image: track.album?.images?.[track.album.images.length - 1]?.url || null,
      album_image_large: track.album?.images?.[0]?.url || null,
    };
  } catch {
    return null;
  }
}

// Look up a single artist by name. Returns null if no match.
export async function searchArtist(name) {
  try {
    const token = await getAccessToken();
    const query = encodeURIComponent(name);
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${query}&type=artist&limit=1`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (!response.ok) return null;

    const data = await response.json();
    const artist = data.artists?.items?.[0];
    if (!artist) return null;

    return {
      spotify_id: artist.id,
      spotify_url: artist.external_urls.spotify,
      image: artist.images?.[artist.images.length - 1]?.url || null,
      image_large: artist.images?.[0]?.url || null,
      genres: artist.genres || [],
    };
  } catch {
    return null;
  }
}
