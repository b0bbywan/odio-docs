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

`scripts/fetch-github-stats.mjs` uses the local `gh` CLI to collect PR / commit / release / issue / star / fork / discussion data for the repos in `src/data/ecosystem.js`. Outputs minified `src/data/stats.json`. It also collects merged PRs and issues authored in third-party repos, scoped to the curated list in `src/data/upstream.js` (an unscoped `author:` search returns years of work unrelated to odio); they render as the *Upstream contributions* section of `Activity.jsx`.

The stats are **decoupled from the site build**: the `Stats` workflow (`.github/workflows/stats.yml`, daily cron + manual dispatch) runs the script and publishes the JSON to GitHub Pages, served at `https://stats.odio.love/repos.json`. `src/components/Activity.astro` fetches that URL **client-side**, so refreshed stats appear live without a rebuild and the site build needs no GitHub token. The page lives at `src/content/docs/guides/activity.mdx`. `docs.odio.love/stats.json` still works via a redirect to the new URL (`vercel.json`).

`src/data/seo.ts` needs the latest odios version for its `softwareVersion` JSON-LD field; it reads it at build from GitHub's `releases/latest` redirect (no token, no API), falling back to omitting the field on failure. Nothing else imports `src/data/stats.json` at build time.

The sister site `odio.love` also ships a compact KPI strip; it reads the same `https://stats.odio.love/repos.json`, so this workflow is the only place the stats are generated.
