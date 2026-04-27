'use client';

import { useState, useEffect } from 'react';
import PlaylistResult from './components/PlaylistResult';

const MOODS = ['melancholy', 'euphoric', 'focused', 'restless', 'tender', 'pensive', 'rage', 'drift'];

export default function Page() {
  const [mode, setMode] = useState('similar');
  const [artist, setArtist] = useState('');
  const [song1, setSong1] = useState('');
  const [song2, setSong2] = useState('');
  const [mood, setMood] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;0,9..144,900;1,9..144,400;1,9..144,700&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  async function discover() {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const response = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, artist, song1, song2, mood }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Something went wrong.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Could not reach the curator. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const display = { fontFamily: '"Fraunces", Georgia, serif' };
  const sans = { fontFamily: '"DM Sans", system-ui, sans-serif' };
  const mono = { fontFamily: '"JetBrains Mono", monospace' };

  const cream = '#f5f0e8';
  const ink = '#14110d';
  const ember = '#f4a02b';
  const muted = '#8a7f72';
  const soft = '#c8bfb1';

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
        input::placeholder, textarea::placeholder { color: ${muted}88; }
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
        <header style={{ marginBottom: 56 }}>
          <div style={{ ...mono, fontSize: 11, letterSpacing: '0.3em', color: ember, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="pulse-dot">◉</span> ON AIR · LATE NIGHT FREQUENCY
          </div>
          <h1 style={{ ...display, fontSize: 'clamp(56px, 10vw, 112px)', fontWeight: 900, lineHeight: 0.9, margin: 0, letterSpacing: '-0.04em' }}>
            <span style={{ fontStyle: 'italic', fontWeight: 400 }}>tuning</span><br />
            the dial.
          </h1>
          <p style={{ marginTop: 24, maxWidth: 480, fontSize: 16, lineHeight: 1.5, color: soft }}>
            Tell the curator what you love or how you feel. Get a playlist back.
          </p>
        </header>

        <div style={{ display: 'flex', borderBottom: `1px solid ${muted}33`, marginBottom: 32 }}>
          {[
            { key: 'similar', label: 'similar to' },
            { key: 'mood', label: 'how I feel' }
          ].map(m => (
            <button
              key={m.key}
              onClick={() => { setMode(m.key); setResult(null); setError(''); }}
              style={{
                ...mono, background: 'transparent', border: 'none',
                color: mode === m.key ? ember : muted,
                fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase',
                padding: '16px 0', marginRight: 32, cursor: 'pointer',
                borderBottom: mode === m.key ? `1px solid ${ember}` : '1px solid transparent',
                marginBottom: -1, transition: 'color 0.2s'
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === 'similar' ? (
          <div style={{ display: 'grid', gap: 24 }}>
            <Field label="01 / artist you love" value={artist} onChange={setArtist} placeholder="e.g. Mitski" mono={mono} muted={muted} cream={cream} ember={ember} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
              <Field label="02 / a song" value={song1} onChange={setSong1} placeholder="Nobody" mono={mono} muted={muted} cream={cream} ember={ember} />
              <Field label="03 / another song" value={song2} onChange={setSong2} placeholder="Your Best American Girl" mono={mono} muted={muted} cream={cream} ember={ember} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 20 }}>
            <Field label="how are you feeling" value={mood} onChange={setMood} placeholder="restless, like I want to walk for hours and not talk to anyone" mono={mono} muted={muted} cream={cream} ember={ember} textarea />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {MOODS.map(m => (
                <button
                  key={m}
                  onClick={() => setMood(prev => prev ? `${prev}, ${m}` : m)}
                  style={{
                    ...mono, background: 'transparent', border: `1px solid ${muted}55`,
                    color: cream, padding: '6px 14px', borderRadius: 999,
                    fontSize: 11, letterSpacing: '0.1em', cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = ember; e.currentTarget.style.color = ember; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = `${muted}55`; e.currentTarget.style.color = cream; }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ ...mono, marginTop: 24, fontSize: 12, color: '#e85d4f', letterSpacing: '0.1em' }}>
            ⚠ {error}
          </div>
        )}

        <button
          onClick={discover}
          disabled={loading}
          style={{
            ...display, marginTop: 32, background: ember, color: ink, border: 'none',
            padding: '20px 40px', fontSize: 24, fontWeight: 700, fontStyle: 'italic',
            cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
            display: 'inline-flex', alignItems: 'center', gap: 12,
            transition: 'transform 0.15s, opacity 0.2s'
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          {loading ? (<><span className="pulse-dot">◉</span> tuning…</>) : (<>spin it →</>)}
        </button>

        {result && (
          <div style={{ marginTop: 80 }}>
            <PlaylistResult result={result} />
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, mono, muted, cream, ember, textarea }) {
  const [focused, setFocused] = useState(false);
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <label style={{ display: 'block' }}>
      <div style={{ ...mono, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: muted, marginBottom: 8 }}>{label}</div>
      <Tag
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={textarea ? 3 : undefined}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', background: 'transparent', border: 'none',
          borderBottom: `1px solid ${focused ? ember : muted + '55'}`,
          color: cream, fontSize: 22, padding: '8px 0', outline: 'none',
          fontFamily: 'inherit', resize: textarea ? 'vertical' : 'none',
          transition: 'border-color 0.2s', boxSizing: 'border-box'
        }}
      />
    </label>
  );
}
