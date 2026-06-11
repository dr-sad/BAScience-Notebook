# Canopy Mobile

A standalone, responsive web version of the Canopy game for phones. Play the tutorial, play against a friend (Me vs you), or play against a computer monster (Me vs monster).

## Build

```bash
cd canopy-mobile
npm install
npm run build
```

The playable static site is generated in the **`out/`** directory. All HTML, CSS, JS, and assets (including images in `public/`) are written there.

## Deploy to GitHub Pages (https://dr-sad.github.io/canopy-game/)

1. **Create the repo** (if needed): [https://github.com/dr-sad/canopy-game](https://github.com/dr-sad/canopy-game)

2. **Build** (see above), then copy the **contents** of `out/` into the root of the **canopy-game** repo:
   - `out/index.html` → repo root `index.html`
   - `out/instructions.html`, `out/play.html` → repo root
   - `out/_next/` → repo root `_next/`
   - `out/assets/` (if present) → repo root `assets/`
   - Any other files or folders under `out/` go to the repo root.

3. **Enable GitHub Pages** for the repo:
   - Settings → Pages → Source: **Deploy from a branch**
   - Branch: e.g. `main` (or the branch you push to)
   - Folder: **/ (root)**

4. After pushing, the game is live at **https://dr-sad.github.io/canopy-game/** and playable on a phone.

## Run locally

- **Development:** `npm run dev` — open **http://localhost:3000/canopy-game** (basePath is applied).
- **Production build:** `npm run build` then serve the `out/` folder with any static server; use base path `/canopy-game` when opening (e.g. http://localhost:8080/canopy-game/).

## Project structure

- **`app/`** — Next.js App Router: home (`/`), instructions (`/instructions`), play (`/play?mode=...`).
- **`components/`** — Canopy game UI and context (duplicated from the interactive book).
- **`data/`** — Instructions content and image paths.
- **`public/`** — Static assets (e.g. instruction images). Copied into `out/` on build.
