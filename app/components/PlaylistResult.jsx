'use client';

import { useState, useEffect, useRef } from 'react';
import { encodePlaylist } from '../lib/share';

export default function PlaylistResult({ result, isShared = false }) {
  const [playingIndex, setPlayingIndex] = useState(null);
  const [shareState, setShareState] = useState('idle'); // idle | copied
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingIndex(null);
    }
  }, [result]);

  function togglePreview(index, previewUrl) {
    if (!previewUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener('ended', () => setPlayingIndex(null));
    }
    if (playingIndex === index) {
      audioRef.current.pause();
      setPlayingIndex(null);
    } else {
      audioRef.current.src = previewUrl;
      audioRef.current.play().catch(() => setPlayingIndex(null));
      setPlayingIndex(index);
    }
  }

  async function handleShare() {
    const id = encodePlaylist(result);
    const url = `${window.location.origin}/p/${id}`;

    // Use the native share sheet on mobile if available, otherwise copy to clipboard.
    if (navigator.share) {
      try {
        await navigator.share({
          title: result.playlist_title,
          text: result.vibe_description,
          url,
        });
        return;
      } catch {
        // User cancelled or share failed; fall through to clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 2000);
    } catch {
      // Clipboard failed; show URL inline as a fallback.
      window.prompt('Copy this link:', url);
    }
  }

  const display = { fontFamily: '"Fraunces", Georgia, serif' };
  const mono = { fontFamily: '"JetBrains Mono", monospace' };
  const cream = '#f5f0e8';
  const ink = '#14110d';
  const ember = '#f4a02b';
  const muted = '#8a7f72';
  const soft = '#c8bfb1';

  return (
    <div className="result-fade">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ ...mono, fontSize: 11, letterSpacing: '0.3em', color: ember }}>
          ── side a ──
        </div>
        <button
          onClick={handleShare}
          style={{
            ...mono,
            background: 'transparent',
            border: `1px solid ${shareState === 'copied' ? ember : muted + '55'}`,
            color: shareState === 'copied' ? ember : cream,
            padding: '8px 16px',
            borderRadius: 999,
            fontSize: 11,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (shareState !== 'copied') { e.currentTarget.style.borderColor = ember; e.currentTarget.style.color = ember; } }}
          onMouseLeave={e => { if (shareState !== 'copied') { e.currentTarget.style.borderColor = `${muted}55`; e.currentTarget.style.color = cream; } }}
        >
          {shareState === 'copied' ? '✓ link copied' : 'share ↗'}
        </button>
      </div>

      <h2 style={{ ...display, fontSize: 'clamp(40px, 6vw, 64px)', fontStyle: 'italic', fontWeight: 700, lineHeight: 1, margin: 0, letterSpacing: '-0.02em' }}>
        {result.playlist_title}
      </h2>
      <p style={{ marginTop: 16, fontSize: 16, lineHeight: 1.6, color: soft, maxWidth: 560 }}>
        {result.vibe_description}
      </p>

      <div style={{ marginTop: 40 }}>
        {result.songs?.map((song, i) => (
          <SongRow
            key={i}
            song={song}
            index={i}
            isPlaying={playingIndex === i}
            onTogglePlay={() => togglePreview(i, song.spotify?.preview_url)}
            display={display}
            mono={mono}
            cream={cream}
            ember={ember}
            muted={muted}
            soft={soft}
            ink={ink}
          />
        ))}
      </div>

      {result.similar_artists?.length > 0 && (
        <div style={{ marginTop: 64 }}>
          <div style={{ ...mono, fontSize: 11, letterSpacing: '0.3em', color: ember, marginBottom: 24 }}>── also dig ──</div>
          <div style={{ display: 'grid', gap: 24 }}>
            {result.similar_artists.map((a, i) => (
              <ArtistRow key={i} artist={a} display={display} mono={mono} cream={cream} ember={ember} muted={muted} soft={soft} />
            ))}
          </div>
        </div>
      )}

      {isShared && (
        <div style={{ marginTop: 64, padding: '24px 0', borderTop: `1px solid ${muted}22`, textAlign: 'center' }}>
          <a
            href="/"
            style={{
              ...display,
              fontSize: 20,
              fontStyle: 'italic',
              color: ember,
              textDecoration: 'none',
              borderBottom: `1px solid ${ember}55`,
              paddingBottom: 2,
            }}
          >
            tune your own dial →
          </a>
        </div>
      )}
    </div>
  );
}

function SongRow({ song, index, isPlaying, onTogglePlay, display, mono, cream, ember, muted, soft, ink }) {
  const hasPreview = !!song.spotify?.preview_url;
  const albumArt = song.spotify?.album_image;

  return (
    <div className="song-row" style={{
      display: 'grid',
      gridTemplateColumns: '40px 64px 1fr',
      gap: 16,
      padding: '20px 0',
      borderTop: `1px solid ${muted}22`,
      alignItems: 'start'
    }}>
      <div style={{ ...mono, fontSize: 12, color: ember, paddingTop: 22 }}>
        {String(index + 1).padStart(2, '0')}
      </div>

      <div style={{ position: 'relative', width: 64, height: 64, marginTop: 4 }}>
        {albumArt ? (
          <img
            src={albumArt}
            alt=""
            className={isPlaying ? 'album-spin' : ''}
            style={{
              width: 64, height: 64,
              borderRadius: isPlaying ? '50%' : 4,
              objectFit: 'cover',
              transition: 'border-radius 0.4s'
            }}
          />
        ) : (
          <div style={{
            width: 64, height: 64, borderRadius: 4,
            background: `${muted}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            ...mono, fontSize: 10, color: muted
          }}>
            ♪
          </div>
        )}
        {hasPreview && (
          <button
            className="play-btn"
            onClick={onTogglePlay}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(20, 17, 13, 0.7)',
              border: 'none', borderRadius: isPlaying ? '50%' : 4,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: isPlaying ? 1 : 0,
              transform: isPlaying ? 'scale(1)' : 'scale(0.9)',
              transition: 'opacity 0.2s, transform 0.2s, border-radius 0.4s',
              color: ember, fontSize: 20
            }}
            aria-label={isPlaying ? 'Pause' : 'Play 30-second preview'}
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>
        )}
      </div>

      <div>
        <div style={{ ...display, fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
          {song.title}
        </div>
        <div style={{ ...mono, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: muted, marginTop: 4 }}>
          {song.artist}
        </div>
        {song.note && (
          <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: soft, maxWidth: 540 }}>
            {song.note}
          </div>
        )}
        <div style={{ marginTop: 10, display: 'flex', gap: 16, alignItems: 'center', ...mono, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          {song.spotify?.spotify_url && (
            <a href={song.spotify.spotify_url} target="_blank" rel="noopener noreferrer" className="spotify-link">
              open in spotify ↗
            </a>
          )}
          {!hasPreview && song.spotify?.spotify_url && (
            <span style={{ color: `${muted}88` }}>no preview available</span>
          )}
          {!song.spotify && (
            <span style={{ color: `${muted}88` }}>not found on spotify</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ArtistRow({ artist, display, mono, cream, ember, muted, soft }) {
  const image = artist.spotify?.image;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '64px 1fr',
      gap: 18,
      alignItems: 'start',
      borderLeft: `2px solid ${ember}`,
      paddingLeft: 18,
    }}>
      {image ? (
        <img src={image} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
      ) : (
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: `${muted}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          ...display, fontSize: 24, fontStyle: 'italic', color: muted
        }}>
          {artist.name.charAt(0)}
        </div>
      )}
      <div>
        <div style={{ ...display, fontSize: 24, fontWeight: 700, fontStyle: 'italic' }}>
          {artist.name}
        </div>
        <div style={{ marginTop: 4, fontSize: 14, lineHeight: 1.5, color: soft }}>
          {artist.reason}
        </div>
        {artist.spotify?.spotify_url && (
          <a
            href={artist.spotify.spotify_url}
            target="_blank"
            rel="noopener noreferrer"
            className="spotify-link"
            style={{ ...mono, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', display: 'inline-block', marginTop: 8 }}
          >
            open in spotify ↗
          </a>
        )}
      </div>
    </div>
  );
}
