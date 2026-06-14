import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

// Snapshot the current release-asset download counts for every ecosystem repo
// that publishes GitHub release assets. Pre-releases are excluded.
//
// Like fetch-github-stats.mjs, this is regenerated from scratch each run (the
// GitHub API exposes each asset's current download_count), so nothing needs to
// persist between runs and nothing is committed — the Stats workflow publishes
// the output next to repos.json.

const exec = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const owner = args.find((a) => a.startsWith('--owner='))?.split('=')[1] || 'b0bbywan';

const ecosystemPath = join(root, 'src/data/ecosystem.js');
const ecosystemSrc = readFileSync(ecosystemPath, 'utf8');
const ownerPattern = owner.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const repoNames = [
  ...new Set(
    [...ecosystemSrc.matchAll(new RegExp(`github\\.com/${ownerPattern}/([a-z0-9.-]+)`, 'gi'))].map(
      (m) => m[1].replace(/\.git$/, '')
    )
  ),
];

console.log(`[downloads] ${repoNames.length} repos for ${owner}`);

async function gh(argv) {
  const { stdout } = await exec('gh', argv, { maxBuffer: 100 * 1024 * 1024 });
  return stdout;
}

async function fetchRepo(name) {
  const repo = `${owner}/${name}`;
  let releases;
  try {
    // --paginate over /releases gives every release with its assets[] (each
    // carrying a download_count). gh's --jq runs per page, so concat the lines.
    const out = await gh([
      'api',
      `/repos/${repo}/releases?per_page=100`,
      '--paginate',
      '--jq',
      '.[]',
    ]);
    releases = out
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l));
  } catch (e) {
    console.warn(`[downloads]   ${name}: releases failed: ${e.message.split('\n')[0]}`);
    return null;
  }

  // Checksums, signatures, branding images and debug-symbol packages are noise on
  // a downloads chart, never an artifact a human installs. Drop them so
  // downloads.json carries only real files.
  const isNoise = (n) =>
    /\.(sha512|sha256|sha1|md5|asc|sig|png|jpe?g|gif|webp)$/i.test(n) || /dbgsym/i.test(n);

  const mapped = releases
    .filter((r) => !r.draft && !r.prerelease)
    .filter((r) => Array.isArray(r.assets) && r.assets.length > 0)
    .map((r) => ({
      tag: r.tag_name,
      date: r.published_at ? r.published_at.slice(0, 10) : null,
      assets: r.assets
        .filter((a) => !isNoise(a.name))
        .map((a) => ({ name: a.name, downloads: a.download_count })),
    }))
    .filter((r) => r.assets.length > 0);

  if (mapped.length === 0) return null; // no downloadable assets — skip silently

  const total = mapped.reduce(
    (a, r) => a + r.assets.reduce((b, x) => b + (x.downloads || 0), 0),
    0
  );
  console.log(`[downloads]   ${name}: ${mapped.length} releases, ${total} downloads`);
  return { name, total, releases: mapped };
}

// Modest concurrency: release listing is one paginated call per repo, well under
// GitHub's secondary rate limits.
const results = new Array(repoNames.length);
const concurrency = 6;
let next = 0;
async function worker() {
  while (next < repoNames.length) {
    const i = next++;
    results[i] = await fetchRepo(repoNames[i]);
  }
}
await Promise.all(Array.from({ length: concurrency }, worker));

const repos = results.filter(Boolean);
const total = repos.reduce((a, r) => a + r.total, 0);

const output = {
  generatedAt: new Date().toISOString(),
  owner,
  total,
  repos,
};

console.log(`[downloads] done — ${repos.length} repos with assets, ${total} total downloads`);

if (dryRun) {
  console.log(JSON.stringify(output, null, 2));
  process.exit(0);
}

writeFileSync(join(root, 'src/data/downloads.json'), JSON.stringify(output));
console.log('[downloads] wrote src/data/downloads.json');
