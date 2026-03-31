# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static HTML/CSS/JS personal portfolio website for Marvin Baptista (VR/game dev + web dev). No build tools, no dependencies, no package.json. Deployed via GitHub Pages from the `docs/` folder.

## Running Locally

Open `docs/index.html` directly in a browser, or serve with any static server:

```bash
npx serve docs
# or
python -m http.server 8000 --directory docs
```

The root `index.html` is just a `<meta>` redirect to `docs/index.html`.

## Architecture

- **`docs/index.html`** — Single-page portfolio (573 lines). All sections are in this file: nav, hero, video showcase, VR case studies, web portfolio grid, interactive demos, GitHub stats, skills, contact.
- **`docs/assets/css/style.css`** — All styles (727 lines). Uses CSS custom properties for the dark theme (neon green `#00ff88` / cyan `#00d4ff` accents), Google Fonts (Archivo Black headings, DM Sans body).
- **`docs/assets/js/main.js`** — Currently a placeholder. Carousel logic lives inline in `docs/index.html` in a `<script>` tag at the bottom of the file.
- **`docs/assets/img/`** — 22 VR game screenshots used in the carousel, plus favicon.

## Key Patterns

- **Carousel:** `scrollCarousel(direction)` function and a 5-second auto-scroll timer are both inline in `docs/index.html`. If you extend carousel behavior, keep it there or move everything to `main.js`.
- **Responsive breakpoint:** 768px (mobile-first, but desktop styles come first in CSS).
- **No JS framework** — vanilla DOM manipulation only.
