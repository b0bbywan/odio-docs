# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Documentation site for **odio** (https://github.com/b0bbywan/odios), built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build). Deployed at https://docs.odio.love.

odio is a multi-source audio system supporting Bluetooth, AirPlay, Spotify Connect, UPnP/DLNA, audio CDs, USB drives, network audio (TCP sink), Tidal/Qobuz, and multi-room via Snapcast.

## Commands

```bash
npm run dev       # Dev server at localhost:4321
npm run build     # Production build to ./dist/
npm run preview   # Preview production build locally
npm run stats     # Regenerate GitHub activity stats (reads src/data/ecosystem.js, needs gh CLI)
```

## Architecture

- **Content**: All documentation pages live in `src/content/docs/` as `.md`/`.mdx` files. Each file maps to a route by filename.
- **Sidebar config**: Defined in `astro.config.mjs` within the `starlight()` integration — sidebar entries must reference docs by `slug` (e.g., `guides/introduction`).
- **Content schema**: `src/content.config.ts` uses Starlight's default `docsSchema()` — no custom fields.
- **Custom theme**: Dark green theme in `src/styles/custom.css`, referenced via `customCss` in `astro.config.mjs`.
- **Static assets**: `public/` for static files (favicon), `src/assets/` for images embedded in docs.

## Adding a New Doc Page

1. Create a `.md` or `.mdx` file in `src/content/docs/guides/`.
2. Add a corresponding sidebar entry in `astro.config.mjs` under the appropriate section.

## Activity / stats pipeline

`scripts/fetch-github-stats.mjs` uses the local `gh` CLI to collect PR / commit / release / issue / star / fork / discussion data for the repos in `src/data/ecosystem.js`. Outputs minified `src/data/stats.json` (consumed by `src/components/Activity.astro` at build time). The same JSON is served at `https://docs.odio.love/stats.json` through `src/pages/stats.json.ts` (endpoint, no duplication). The page lives at `src/content/docs/guides/activity.mdx`.

The sister site `odio.love` also ships a compact KPI strip linking here; its copy of `stats.json` is regenerated with the same script on that side.
