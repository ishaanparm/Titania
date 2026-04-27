import { decodePlaylist } from '../../../lib/share';
import { enrichWithSpotify } from '../../../lib/enrich';

export async function GET(request, { params }) {
  const { id } = params;
  const decoded = decodePlaylist(id);
  if (!decoded) {
    return Response.json({ error: 'Invalid share link.' }, { status: 400 });
  }
  const enriched = await enrichWithSpotify(decoded);
  return Response.json(enriched);
}
