import LZString from 'lz-string';

// Encode a playlist into a URL-safe compressed string.
// We strip Spotify enrichment data before encoding — it gets re-fetched on view.
// This keeps share URLs much shorter and ensures Spotify data is always fresh.
export function encodePlaylist(result) {
  const minimal = {
    t: result.playlist_title,
    v: result.vibe_description,
    s: (result.songs || []).map(song => ({
      t: song.title,
      a: song.artist,
      n: song.note,
    })),
    a: (result.similar_artists || []).map(artist => ({
      n: artist.name,
      r: artist.reason,
    })),
  };
  return LZString.compressToEncodedURIComponent(JSON.stringify(minimal));
}

// Decode a share ID back into a playlist result. Returns null if invalid.
export function decodePlaylist(id) {
  try {
    const json = LZString.decompressFromEncodedURIComponent(id);
    if (!json) return null;
    const minimal = JSON.parse(json);
    return {
      playlist_title: minimal.t,
      vibe_description: minimal.v,
      songs: (minimal.s || []).map(s => ({
        title: s.t,
        artist: s.a,
        note: s.n,
      })),
      similar_artists: (minimal.a || []).map(a => ({
        name: a.n,
        reason: a.r,
      })),
    };
  } catch {
    return null;
  }
}
