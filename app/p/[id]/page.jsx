'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PlaylistResult from '../../components/PlaylistResult';

export default function SharedPlaylistPage() {
  const params = useParams();
  const id = params?.id;
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;0,9..144,900;1,9..144,400;1,9..144,700&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/share/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setResult(data);
      })
      .catch(() => setError('Could not load this playlist.'))
      .finally(() => setLoading(false));
  }, [id]);

  const display = { fontFamily: '"Fraunces", Georgia, serif' };
  const sans = { fontFamily: '"DM Sans", system-ui, sans-serif' };
  const mono = { fontFamily: '"JetBrains Mono", monospace' };

  const cream = '#f5f0e8';
  const ink = '#14110d';
  const ember = '#f4a02b';
  const muted = '#8a7f72';

  return (
    <div style={{ ...sans, backgroundColor: ink, minHeight: '100vh', color: cream }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .result-fade > * { animation: fadeUp 0.5s ease-out backwards; }
        .result-fade > *:nth-child(1) { animation-delay: 0.05s; }
        .result-fade > *:nth-child(2) { animation-delay: 0.15s; }
        .result-fade > *:nth-child(3) { animation-delay: 0.25s; }
        .result-fade > *:nth-child(4) { animation-delay: 0.35s; }
        .pulse-dot { animation: pulse 1.4s ease-in-out infinite; }
        .album-spin { animation: spin 8s linear infinite; }
        .song-row:hover .play-btn { opacity: 1; transform: scale(1); }
        a.spotify-link { color: ${muted}; text-decoration: none; transition: color 0.2s; }
        a.spotify-link:hover { color: #1DB954; }
      `}</style>

      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.05, mixBlendMode: 'overlay',
        backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>")',
        zIndex: 1
      }} />

      <div style={{ maxWidth: 880, margin: '0 auto', padding: '48px 24px 96px', position: 'relative', zIndex: 2 }}>
        <header style={{ marginBottom: 48 }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <div style={{ ...mono, fontSize: 11, letterSpacing: '0.3em', color: ember, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pulse-dot">◉</span> TUNING THE DIAL
            </div>
          </a>
          <div style={{ ...mono, fontSize: 11, letterSpacing: '0.2em', color: muted, textTransform: 'uppercase' }}>
            shared playlist
          </div>
        </header>

        {loading && (
          <div style={{ ...mono, fontSize: 14, color: muted, letterSpacing: '0.2em' }}>
            <span className="pulse-dot">◉</span> loading the dial…
          </div>
        )}

        {error && (
          <div style={{ marginTop: 24 }}>
            <div style={{ ...display, fontSize: 32, fontWeight: 700, fontStyle: 'italic' }}>
              this link looks broken
            </div>
            <p style={{ marginTop: 12, fontSize: 16, color: muted }}>{error}</p>
            <a href="/" style={{ ...mono, fontSize: 11, letterSpacing: '0.2em', color: ember, textTransform: 'uppercase', display: 'inline-block', marginTop: 24, textDecoration: 'none', borderBottom: `1px solid ${ember}55` }}>
              start fresh →
            </a>
          </div>
        )}

        {result && <PlaylistResult result={result} isShared={true} />}
      </div>
    </div>
  );
}
