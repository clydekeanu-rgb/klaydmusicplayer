# Aura Music — YouTube Music Streaming Player

A modern, high-performance YouTube Music streaming web player powered by a dedicated Node.js backend (optimized for [Render](https://render.com)) and a React SPA frontend with dual-engine crossfade playback, synchronized lyrics, and dynamic album-art theming.

---

## 🏛️ Architecture Overview

```
Browser (React SPA)  <──HTTPS/JSON──>  Node.js API (Render / Local)  <──>  YouTube Music (InnerTube API)
       │                                         │
       │ (Dual-IFrame Audio Engine               ├─> In-memory TTL Cache (search, metadata, lyrics)
       │  bypasses PoToken blocks)               └─> Lyrics source (LRCLIB API)
       │
       └─> IndexedDB (local queue, history, favorites, settings)
```

- **Backend (Node.js / Render)**: Dedicated service built with TypeScript, `@hono/node-server`, and `youtubei.js` that provides search, metadata, and lyrics endpoints with zero sub-second CPU limits.
- **Frontend (React 19 + TypeScript + Vite + Tailwind CSS)**: Full-featured music player featuring a dual-player engine with smooth crossfade transitions, dynamic CSS palette extraction from album artwork via HTML5 canvas, interactive real-time synchronized lyrics with click-to-seek, and IndexedDB local persistence.

---

## ⚡ Features

1. **Dual-Player Engine with Crossfade**:
   - Two hidden player channels for seamless transitions.
   - Smooth, configurable crossfading (0 to 12 seconds) without volume clipping or audio gaps.
   - MediaSession API integration for hardware media keys (play/pause, next, previous, seek) and OS lock screen controls.
2. **Dynamic Album-Art Theming**:
   - Canvas-based color quantization extracts dominant and vibrant accents from the active song's album art.
   - Ambient background gradients and glow CSS variables (`--theme-primary`, `--theme-glow`, `--theme-bg-start`, `--theme-bg-end`) transition smoothly between tracks.
3. **Synchronized Lyrics (LRCLIB)**:
   - Parses standard `.lrc` timestamps `[mm:ss.xx]`.
   - Real-time active lyric line highlighting with smooth auto-scrolling to center view.
   - Interactive **click-to-seek**: tapping any line immediately jumps playback to that lyric.
4. **Queue Management & Smart Radio**:
   - Play next, add to queue, clear, and reorder.
   - Non-destructive Fisher-Yates shuffle with clean unshuffle restoration.
   - Repeat modes: `off`, `all`, and `one`.
   - **Smart Radio**: Auto-queries related tracks via InnerTube `getUpNext` when nearing the end of the queue.
5. **Persistence**:
   - IndexedDB database (`ytm_player_db`) persists recently played history, favorite tracks, and user preferences across reloads.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health check and endpoint listing |
| `GET` | `/api/search?q={query}` | Searches YouTube Music and returns normalized track results |
| `GET` | `/api/metadata/:videoId` | Resolves title, artist, album, duration, and high-res thumbnails |
| `GET` | `/api/lyrics?title=&artist=` | Fetches synced and plain lyrics from LRCLIB |
| `GET` | `/api/related/:videoId` | Fetches up to 50 related tracks for queue autofill and radio playback |

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js `v18+` (Tested on Node v20/v24)
- npm `v9+`

### 1. Run the Backend Server
```bash
npm run dev:backend
```
The API server will start locally on `http://127.0.0.1:8787`.

### 2. Run the Frontend SPA
In a separate terminal:
```bash
npm run dev:frontend
```
Open `http://localhost:5173` in your browser. All `/api/*` calls are automatically proxied to the backend at port `8787`.

### 3. Run Automated API Tests
```bash
npm run test:backend
```

---

## 📦 Deployment

### Deploy Backend to Render
1. Push your repository to GitHub.
2. In [dashboard.render.com](https://dashboard.render.com), click **New +** $\rightarrow$ **Web Service**.
3. Connect your repository. Render automatically reads [`render.yaml`](render.yaml) or you can configure manually:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
   - **Health Check Path**: `/api/health`
4. Copy your live Render URL (e.g. `https://ytm-stream-backend.onrender.com`).

### Deploy Frontend SPA
1. In your frontend hosting platform (Cloudflare Pages, Vercel, Netlify):
   - Add environment variable: `VITE_API_BASE=https://ytm-stream-backend.onrender.com`
   - Build Command: `cd frontend && npm run build` (or set Root Directory to `frontend` with `npm run build`)
   - Output Directory: `dist` (or `frontend/dist`)
