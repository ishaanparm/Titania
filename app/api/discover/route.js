import { enrichWithSpotify } from '../../lib/enrich';

export const maxDuration = 30; // Allow up to 30s on Vercel for Spotify enrichment

// Extract a JSON object from a string, even if Claude wrapped it in preamble/markdown.
function extractJSON(text) {
  if (!text) return null;
  // Try direct parse first.
  try { return JSON.parse(text); } catch {}
  // Strip markdown fences.
  const stripped = text.replace(/```json|```/g, '').trim();
  try { return JSON.parse(stripped); } catch {}
  // Find the first { and last } and try parsing the substring.
  const first = stripped.indexOf('{');
  const last = stripped.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    const candidate = stripped.slice(first, last + 1);
    try { return JSON.parse(candidate); } catch {}
  }
  return null;
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'Server is missing ANTHROPIC_API_KEY' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { mode, artist, song1, song2, mood } = body;

  let prompt;
  if (mode === 'similar') {
    if (!artist?.trim() || !song1?.trim() || !song2?.trim()) {
      return Response.json({ error: 'Add an artist and two songs.' }, { status: 400 });
    }
    prompt = `You are a music discovery curator with deep knowledge across genres and eras.
The listener loves: artist "${artist}", songs "${song1}" and "${song2}".

Recommend 8 similar songs and 5 similar artists. Mix obvious picks with deeper cuts so it feels like a real friend's recommendation. Real songs by real artists, no fabrications. Use the most common spelling of titles and artist names so they're easy to find on Spotify.

Respond with ONLY a single valid JSON object, no markdown, no preamble, no explanation. The JSON must have this exact structure:
{
  "playlist_title": "evocative 2-4 word title",
  "vibe_description": "1-2 sentences describing the sonic territory",
  "songs": [
    {"title": "song title", "artist": "artist name", "note": "1 sentence on why it fits"}
  ],
  "similar_artists": [
    {"name": "artist name", "reason": "1 sentence on the connection"}
  ]
}`;
  } else if (mode === 'mood') {
    if (!mood?.trim()) {
      return Response.json({ error: 'Tell the curator how you feel.' }, { status: 400 });
    }
    prompt = `You are a music curator who builds playlists tuned to specific moods.
The listener is feeling: "${mood}".

Build a 10-song playlist that matches this mood. Mix genres, eras, and energy. Real songs by real artists, no fabrications. Use the most common spelling of titles and artist names so they're easy to find on Spotify.

Respond with ONLY a single valid JSON object, no markdown, no preamble, no explanation. The JSON must have this exact structure:
{
  "playlist_title": "evocative 2-4 word title",
  "vibe_description": "1-2 sentences capturing the emotional territory",
  "songs": [
    {"title": "song title", "artist": "artist name", "note": "1 sentence on the feel"}
  ],
  "similar_artists": []
}`;
  } else {
    return Response.json({ error: 'Unknown mode' }, { status: 400 });
  }

  let parsed;
  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return Response.json({ error: 'Upstream error: ' + errText.slice(0, 200) }, { status: 502 });
    }

    const data = await upstream.json();
    const text = (data?.content || []).map(b => b?.text || '').join('').trim();

    parsed = extractJSON(text);
    if (!parsed) {
      return Response.json({ error: 'Curator returned malformed JSON. Try again.' }, { status: 502 });
    }

    // Sanity-check the structure before sending to the client.
    if (!parsed.playlist_title || !Array.isArray(parsed.songs)) {
      return Response.json({ error: 'Curator returned unexpected structure. Try again.' }, { status: 502 });
    }
    parsed.similar_artists = Array.isArray(parsed.similar_artists) ? parsed.similar_artists : [];
  } catch (err) {
    return Response.json({ error: err.message || 'Server error' }, { status: 500 });
  }

  const enriched = await enrichWithSpotify(parsed);
  return Response.json(enriched);
}
