# Tuning the Dial — Deployment Guide

A personalized music recommendation site. Claude generates the recommendations; Spotify provides album art, 30-second previews, and links to full tracks. Every playlist gets a shareable link.

This guide walks you from zero to a live URL. No prior experience required.

---

## What you're shipping

- A Next.js website with two modes: "similar to" (artist + 2 songs → recommendations) and "how I feel" (mood → playlist)
- A backend route that calls Claude server-side (key stays secret) and enriches results with Spotify data
- 30-second song previews playable in-browser, plus "open in Spotify" links
- **Share-by-link**: every playlist gets a unique URL anyone can open
- Free hosting on Vercel with auto-deploy on every GitHub push

---

## Step 1 — Get an Anthropic API key

1. Go to https://console.anthropic.com
2. Sign up, add a payment method, buy a small amount of credit (5 dollars goes a long way with Haiku)
3. Settings → API Keys → Create Key
4. Copy the key (starts with `sk-ant-...`). You'll paste it into Vercel later.

---

## Step 2 — Get Spotify API credentials

1. Go to https://developer.spotify.com/dashboard and log in (free Spotify account works)
2. Click "Create app"
3. Fill in:
   - App name: anything, e.g. "Tuning the Dial"
   - App description: anything
   - Redirect URI: `http://localhost:3000` (we don't actually use it for this flow, but Spotify requires one)
   - Which API/SDKs are you planning to use: check "Web API"
4. Agree to terms, click Save
5. Click "Settings" on the new app
6. Copy the **Client ID** (visible) and **Client secret** (click "View client secret")

Spotify's free tier is generous and doesn't require billing.

---

## Step 3 — Put this code on GitHub

You don't need a terminal. Use the GitHub website.

1. Go to https://github.com and create an account if you don't have one
2. Click "New repository", name it `music-taste` (or anything), keep it public or private, do NOT add a README
3. On the next page, click "uploading an existing file"
4. Drag every file and folder from this project into the upload zone
5. Click "Commit changes"

Verify the structure on GitHub looks like this:

```
music-taste/
├── app/
│   ├── api/
│   │   ├── discover/route.js
│   │   └── share/[id]/route.js
│   ├── components/
│   │   └── PlaylistResult.jsx
│   ├── lib/
│   │   ├── enrich.js
│   │   ├── share.js
│   │   └── spotify.js
│   ├── p/[id]/page.jsx
│   ├── globals.css
│   ├── layout.jsx
│   └── page.jsx
├── .gitignore
├── .env.local.example
├── next.config.js
├── package.json
└── README.md
```

The `.env.local` file should NOT appear on GitHub. The `.gitignore` is what prevents that — keep it.

---

## Step 4 — Deploy to Vercel

1. Go to https://vercel.com and sign up with your GitHub account
2. Click "Add New" → "Project"
3. Find your `music-taste` repo and click "Import"
4. Before clicking Deploy, expand "Environment Variables" and add three:
   - `ANTHROPIC_API_KEY` = your key from Step 1
   - `SPOTIFY_CLIENT_ID` = from Step 2
   - `SPOTIFY_CLIENT_SECRET` = from Step 2
5. Click "Deploy"

Wait roughly 1–2 minutes. Vercel will give you a URL like `music-taste-xyz.vercel.app`. Open it. Try both modes.

---

## Step 5 — Make changes

Any time you push a change to GitHub (edit a file in the GitHub web UI, click commit), Vercel rebuilds and your live site updates within a minute.

To test changes locally before pushing:

1. Install Node.js from https://nodejs.org (LTS version)
2. Download this folder to your computer
3. Copy `.env.local.example` to a new file named `.env.local` and fill in all three keys
4. Open a terminal in the folder and run:
   ```
   npm install
   npm run dev
   ```
5. Visit http://localhost:3000

---

## How sharing works

After generating a playlist, a "share" button appears. Tap it:
- **On mobile**: opens the native share sheet (text, WhatsApp, etc.)
- **On desktop**: copies the URL to clipboard

The URL looks like: `your-site.com/p/N4IglgthCBINkhgMxA...`

The compressed string after `/p/` IS the playlist data — it's an encoded snapshot of the titles, artists, and notes Claude generated. When someone opens the link:
1. The server decodes the playlist data from the URL
2. Re-fetches fresh Spotify data (album art, previews, links) in parallel
3. Renders the page

**Why it's done this way:**
- **No database needed.** Zero extra services, zero extra cost, zero extra setup.
- **Links never expire.** They work forever, as long as the site is up.
- **Spotify data stays fresh.** If a track gets a new album cover or its preview URL changes, shared links automatically pick up the new data.

**Tradeoffs:**
- URLs are long (~600–1000 chars). Fine for messaging apps, but ugly. If you want short URLs (`/p/abc123`), add Vercel KV or Upstash Redis later and store playlists with random short IDs.
- Anyone with the URL has the data. There's no privacy layer. If you want private playlists, that needs a database too.

---

## Customizing

- **Change the Claude model**: open `app/api/discover/route.js`, change the `model` field. Options include `claude-haiku-4-5-20251001` (fast, cheap), `claude-sonnet-4-6` (smarter), `claude-opus-4-7` (best, most expensive).
- **Change the prompts**: edit the `prompt` strings in `app/api/discover/route.js` to tune the curator's personality or output.
- **Change the look**: edit `app/page.jsx` and `app/components/PlaylistResult.jsx`. Colors are defined near the top (`cream`, `ink`, `ember`, etc.).

---

## What's NOT included (good next steps)

- **Short share URLs**: add Vercel KV or Upstash Redis, store playlists with random IDs.
- **OG image previews**: when shared on Twitter/iMessage, the link could show a custom image with the playlist title. Use Next.js `@vercel/og` for dynamic image generation.
- **Save to your Spotify**: requires the Authorization Code flow with user login. Lets you add "Save as Spotify playlist" as a real button.
- **Rate limiting**: anyone with your URL can hit your API and burn your Anthropic credits. Add Vercel's rate-limiting middleware or Upstash before sharing publicly.
- **Custom domain**: in Vercel, Settings → Domains, point your own domain at the project.
