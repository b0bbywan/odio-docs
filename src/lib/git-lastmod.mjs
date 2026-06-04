// Maps each docs route to the ISO date of the last git commit that touched its
// source file, for use as <lastmod> in the sitemap. Built lazily and cached, so
// it costs nothing in dev (the sitemap integration only runs on `astro build`).
//
// Needs full git history at build time (CI uses fetch-depth: 0). If git is
// unavailable or a file is untracked, that route simply gets no lastmod — better
// than stamping a uniform/wrong date, which search engines learn to ignore.

import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS = fileURLToPath(new URL('../content/docs', import.meta.url));

function routeOf(rel) {
  return rel
    .replaceAll('\\', '/')
    .replace(/\.(md|mdx)$/, '')
    .replace(/(^|\/)index$/, '');
}

function gitDate(absPath) {
  try {
    return (
      execFileSync('git', ['log', '-1', '--format=%cI', '--', absPath], {
        encoding: 'utf8',
      }).trim() || null
    );
  } catch {
    return null;
  }
}

let cache = null;

function build() {
  const map = new Map();
  for (const entry of readdirSync(DOCS, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !/\.(md|mdx)$/.test(entry.name)) continue;
    const abs = join(entry.parentPath ?? entry.path, entry.name);
    const date = gitDate(abs);
    if (date) map.set(routeOf(abs.slice(DOCS.length + 1)), date);
  }
  return map;
}

/** ISO lastmod for a sitemap URL pathname, or null if unknown. */
export function lastmodFor(pathname) {
  cache ??= build();
  return cache.get(pathname.replace(/^\/+|\/+$/g, '')) ?? null;
}
