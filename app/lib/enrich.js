import { searchTrack, searchArtist } from './spotify';

// Take a parsed playlist from Claude and add Spotify data in parallel.
// Failures are non-fatal — the song/artist still shows, just without art.
export async function enrichWithSpotify(parsed) {
  try {
    const songPromises = (parsed.songs || []).map(async (song) => {
      const spotify = await searchTrack(song.title, song.artist);
      return { ...song, spotify };
    });

    const artistPromises = (parsed.similar_artists || []).map(async (a) => {
      const spotify = await searchArtist(a.name);
      return { ...a, spotify };
    });

    const [enrichedSongs, enrichedArtists] = await Promise.all([
      Promise.all(songPromises),
      Promise.all(artistPromises),
    ]);

    return {
      ...parsed,
      songs: enrichedSongs,
      similar_artists: enrichedArtists,
    };
  } catch (err) {
    console.error('Spotify enrichment failed:', err);
    return parsed;
  }
}
