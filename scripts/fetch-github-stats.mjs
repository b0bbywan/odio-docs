import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { upstreamProjects } from '../src/data/upstream.js';

const exec = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const sinceArg = args.find((a) => a.startsWith('--since='))?.split('=')[1] || '2026-01-01';
const dryRun = args.includes('--dry-run');
const owner = args.find((a) => a.startsWith('--owner='))?.split('=')[1] || 'b0bbywan';

const SINCE = sinceArg;
const SINCE_ISO = `${SINCE}T00:00:00Z`;
const SINCE_TS = Math.floor(new Date(SINCE_ISO).getTime() / 1000);

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

console.log(`[stats] ${repoNames.length} repos since ${SINCE}: ${repoNames.join(', ')}`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// What gh actually complained about. execFile's e.message starts with the whole
// command line, so its first line is the query we already know about, not the
// error — the reason lives on stderr.
function errText(e) {
  const src = (e?.stderr || '').trim() || (e?.message || '').trim();
  const lines = src
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('Command failed:'));
  return lines.join(' | ').slice(0, 400) || 'unknown error';
}

// Retry transient failures so a secondary rate limit doesn't silently drop data.
// A rate-limit 403 always names the limit ("rate limit", "abuse detection"), so
// match on that rather than on the bare status: a permission 403 is permanent,
// and retrying it only burns 30s of backoff per repo.
// "invalid character ... after object key" is gh failing to decode a response
// body; it shows up on bursty search-API calls (pr/issue list) and silently
// dropped whole repos from the PR totals, so retry it like any other throttle.
const isTransient = (text) =>
  /rate limit|secondary rate|too quickly|abuse detection|\b(429|50[0-4])\b|timed? ?out|invalid character/i.test(
    text
  );

const isDenied = (text) => /not accessible|requires authentication|bad credentials/i.test(text);

async function gh(argv) {
  const maxRetries = 4;
  for (let attempt = 0; ; attempt++) {
    try {
      const { stdout } = await exec('gh', argv, { maxBuffer: 100 * 1024 * 1024 });
      return stdout;
    } catch (e) {
      const text = `${e.message}\n${e.stderr || ''}`;
      if (attempt >= maxRetries || !isTransient(text)) throw e;
      // Say when we back off: throttling used to be invisible in the logs, and
      // whatever it dropped came out as a plausible-looking smaller number.
      console.warn(`[stats]   retrying \`gh ${argv.slice(0, 2).join(' ')}\` after: ${errText(e)}`);
      await sleep(2000 * 2 ** attempt); // 2s, 4s, 8s, 16s
    }
  }
}

async function ghJson(argv) {
  const out = await gh(argv);
  return out.trim() ? JSON.parse(out) : null;
}

async function ghApiPaginateArray(endpoint, extraArgs = []) {
  const out = await gh(['api', endpoint, '--paginate', '--jq', '.[]', ...extraArgs]);
  return out
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

async function ghApiPaginateRaw(endpoint, extraArgs = []) {
  const out = await gh(['api', endpoint, '--paginate', ...extraArgs]);
  return out.trim();
}


// Listing a repo's stargazers stopped being readable anonymously (401) and is
// refused outright for fine-grained PATs (403 "Resource not accessible by
// personal access token", even on the token's own repo). The Actions GITHUB_TOKEN
// only sees the repo it runs in. So the timestamps behind the cumulative-stars
// line need a classic PAT with public_repo scope in GH_STATS_TOKEN. When the
// token can't read them, say so once and stop asking for the other 14 repos.
let starDenied = false;
function noteStarFailure(path, e) {
  const text = errText(e);
  if (isDenied(text)) {
    if (!starDenied) {
      console.warn(
        `[stats]   stargazers denied (${path}): ${text} — GH_STATS_TOKEN needs to be a classic PAT with public_repo scope; skipping the stars timeline`
      );
    }
    starDenied = true;
    return;
  }
  console.warn(`[stats]   stargazers via ${path} failed: ${text}`);
}

function isoWeek(dateStr) {
  const d = new Date(dateStr);
  const u = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = u.getUTCDay() || 7;
  u.setUTCDate(u.getUTCDate() + 4 - dayNum);
  const yearStart = Date.UTC(u.getUTCFullYear(), 0, 1);
  const weekNum = Math.ceil(((u.getTime() - yearStart) / 86400000 + 1) / 7);
  return `${u.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

async function fetchRepo(name) {
  const repo = `${owner}/${name}`;
  console.log(`[stats] → ${name}`);

  const info = await ghJson([
    'api',
    `/repos/${repo}`,
    '--jq',
    '{stars: .stargazers_count, forks: .forks_count, description: .description, updatedAt: .updated_at, archived: .archived, defaultBranch: .default_branch, fork: .fork}',
  ]);

  const search = `created:>=${SINCE}`;
  let prs = [];
  try {
    prs = await ghJson([
      'pr',
      'list',
      '--repo',
      repo,
      '--state',
      'all',
      '--search',
      search,
      '--limit',
      '1000',
      '--json',
      'number,state,mergedAt,closedAt,createdAt,isDraft',
    ]) || [];
  } catch (e) {
    console.warn(`[stats]   pr list failed: ${errText(e)}`);
  }
  const prMerged = prs.filter((p) => p.state === 'MERGED').length;
  const prClosed = prs.filter((p) => p.state === 'CLOSED' && !p.mergedAt).length;
  const prOpen = prs.filter((p) => p.state === 'OPEN').length;
  const decided = prMerged + prClosed;
  const mergeRatio = decided > 0 ? prMerged / decided : null;

  let issues = [];
  try {
    issues = await ghJson([
      'issue',
      'list',
      '--repo',
      repo,
      '--state',
      'all',
      '--search',
      search,
      '--limit',
      '1000',
      '--json',
      'number,state,createdAt,closedAt',
    ]) || [];
  } catch (e) {
    console.warn(`[stats]   issue list failed: ${errText(e)}`);
  }
  const issuesOpened = issues.length;
  const issuesClosed = issues.filter((i) => i.state === 'CLOSED').length;

  let releases = [];
  try {
    const all = await ghJson([
      'release',
      'list',
      '--repo',
      repo,
      '--limit',
      '200',
      '--json',
      'tagName,publishedAt,name,isDraft,isPrerelease',
    ]) || [];
    releases = all
      .filter((r) => !r.isDraft && r.publishedAt)
      .filter((r) => new Date(r.publishedAt) >= new Date(SINCE_ISO))
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .map((r) => ({
        tag: r.tagName,
        date: r.publishedAt.slice(0, 10),
        name: r.name || r.tagName,
        prerelease: r.isPrerelease,
      }));
  } catch (e) {
    console.warn(`[stats]   release list failed: ${errText(e)}`);
  }

  let commits = [];
  let mergesSkipped = 0;
  try {
    const all = await ghApiPaginateArray(
      `/repos/${repo}/commits?since=${encodeURIComponent(SINCE_ISO)}&per_page=100`
    );
    // Exclude merge commits (parents.length > 1) from everything downstream:
    // they double-count diffs in LoC sums and inflate commit counts vs the
    // "real work" view shown in GitHub's Code frequency / Contributors pages.
    commits = all.filter((c) => (c.parents?.length || 0) <= 1);
    mergesSkipped = all.length - commits.length;
  } catch (e) {
    console.warn(`[stats]   commits failed: ${errText(e)}`);
  }
  const byWeekMap = {};
  let aiAssisted = 0;
  for (const c of commits) {
    const w = isoWeek(c.commit.author.date);
    byWeekMap[w] = (byWeekMap[w] || 0) + 1;
    if (/Co-Authored-By:\s*Claude/i.test(c.commit.message)) aiAssisted += 1;
  }
  const byWeek = Object.entries(byWeekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([w, c]) => ({ w, c }));

  let locAdded = 0;
  let locRemoved = 0;
  let freq = null;
  // code_frequency 202s while GitHub computes it; retry before the per-commit
  // fallback, whose call-per-commit flood is what trips the rate limiter.
  if (commits.length > 0) {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        freq = await ghJson(['api', `/repos/${repo}/stats/code_frequency`]);
      } catch {}
      if (Array.isArray(freq) && freq.length > 0) break;
      if (attempt < 3) await sleep(2000 * (attempt + 1)); // 2s, 4s, 6s
    }
  }
  if (Array.isArray(freq) && freq.length > 0) {
    for (const [ts, add, rem] of freq) {
      if (ts >= SINCE_TS) {
        locAdded += add;
        locRemoved += Math.abs(rem);
      }
    }
  } else if (commits.length > 0) {
    // Fallback: walk each commit's stats individually (N+1 calls, rate-limit friendly).
    // commits already excludes merges (see source filter above).
    let done = 0;
    const concurrency = 8;
    const queue = [...commits];
    async function worker() {
      while (queue.length) {
        const c = queue.shift();
        try {
          const full = await ghJson(['api', `/repos/${repo}/commits/${c.sha}`]);
          locAdded += full?.stats?.additions || 0;
          locRemoved += full?.stats?.deletions || 0;
        } catch {}
        done += 1;
      }
    }
    await Promise.all(Array.from({ length: concurrency }, worker));
    const skipNote = mergesSkipped > 0 ? `, ${mergesSkipped} merge skipped` : '';
    console.log(`[stats]   loc via per-commit fallback (${done}/${commits.length}${skipNote})`);
  }

  // Discussions (via GraphQL — small counts, no pagination needed for now)
  let discussions = { enabled: false, total: 0, since: 0, answered: 0 };
  try {
    const q = `query { repository(owner: "${owner}", name: "${name}") {
      hasDiscussionsEnabled
      discussions(first: 100, orderBy: { field: CREATED_AT, direction: DESC }) {
        totalCount
        nodes { createdAt answer { id } }
      }
    }}`;
    const d = await ghJson(['api', 'graphql', '-f', `query=${q}`]);
    const rd = d?.data?.repository;
    if (rd) {
      const nodes = rd.discussions?.nodes || [];
      const recent = nodes.filter((n) => n.createdAt >= SINCE_ISO);
      discussions = {
        enabled: Boolean(rd.hasDiscussionsEnabled),
        total: rd.discussions?.totalCount || 0,
        since: recent.length,
        answered: recent.filter((n) => n.answer != null).length,
      };
    }
  } catch (e) {
    console.warn(`[stats]   discussions failed: ${errText(e)}`);
  }

  // Stargazers with timestamps (for the cumulative-stars line). Two independent
  // paths because each has failed under the CI token at some point and an empty
  // result flattens the chart: GraphQL first, then REST with the star+json media
  // type. Whichever answers wins.
  let starEvents = [];
  if (!starDenied) {
    try {
      let cursor = null;
      for (;;) {
        const q = `query($cursor: String) {
        repository(owner: "${owner}", name: "${name}") {
          stargazers(first: 100, after: $cursor, orderBy: { field: STARRED_AT, direction: ASC }) {
            pageInfo { hasNextPage endCursor }
            edges { starredAt }
          }
        }
      }`;
        const argv = ['api', 'graphql', '-f', `query=${q}`];
        if (cursor) argv.push('-f', `cursor=${cursor}`);
        const sg = (await ghJson(argv))?.data?.repository?.stargazers;
        if (!sg) break;
        starEvents.push(...sg.edges.map((e) => e.starredAt).filter(Boolean));
        if (!sg.pageInfo?.hasNextPage) break;
        cursor = sg.pageInfo.endCursor;
      }
    } catch (e) {
      noteStarFailure('graphql', e);
    }
  }
  if (!starDenied && starEvents.length === 0 && (info?.stars ?? 0) > 0) {
    try {
      const rows = await ghApiPaginateArray(`/repos/${repo}/stargazers?per_page=100`, [
        '-H',
        'Accept: application/vnd.github.star+json',
      ]);
      starEvents = rows.map((r) => r.starred_at).filter(Boolean);
      console.log(`[stats]   stargazers via rest fallback (${starEvents.length}/${info.stars})`);
    } catch (e) {
      noteStarFailure('rest', e);
    }
  }

  // All-contributors roster (.all-contributorsrc). Credits any kind of help —
  // code, docs, design, ideas, bug reports — so it's richer than the API's
  // committer list. Most repos don't have the file; a 404 is expected and fine.
  // Skip forks: their roster is the upstream project's (e.g. spotifyd ships 83
  // upstream contributors), which has nothing to do with odio.
  let contributors = [];
  if (!info?.fork) {
    try {
      const raw = await gh([
        'api',
        `/repos/${repo}/contents/.all-contributorsrc`,
        '-H',
        'Accept: application/vnd.github.raw',
      ]);
      const parsed = JSON.parse(raw);
      contributors = (parsed.contributors || []).map((c) => c.login).filter(Boolean);
    } catch {}
  }

  return {
    name,
    description: info?.description || null,
    archived: Boolean(info?.archived),
    defaultBranch: info?.defaultBranch || null,
    updatedAt: info?.updatedAt || null,
    stars: info?.stars ?? 0,
    forks: info?.forks ?? 0,
    starEvents,
    pr: {
      merged: prMerged,
      closedUnmerged: prClosed,
      open: prOpen,
      total: prs.length,
      mergeRatio,
    },
    commits: {
      total: commits.length,
      byWeek,
      aiAssisted,
    },
    loc: { added: locAdded, removed: locRemoved, net: locAdded - locRemoved },
    releases,
    latestRelease: releases.find((r) => !r.prerelease) || null,
    issues: { opened: issuesOpened, closed: issuesClosed },
    discussions,
    contributors,
  };
}

// Contributions to the projects odio builds on, listed in src/data/upstream.js.
// Two search calls per repo, run sequentially: the search API throttles harder
// than the REST one, and there are only a handful of repos to walk.
// `gh search prs` exposes no mergedAt, but a merged PR closes when it merges,
// so closedAt is the merge date here (the query is scoped to --merged).
async function fetchUpstream({ repo, why }) {
  const window = `>=${SINCE}`;
  let prs = [];
  let issues = [];
  try {
    prs = await ghJson([
      'search', 'prs', '--repo', repo, '--author', owner, '--merged',
      '--created', window, '--limit', '100',
      '--json', 'number,title,url,closedAt',
    ]) || [];
  } catch (e) {
    console.warn(`[stats]   upstream pr search failed (${repo}): ${errText(e)}`);
  }
  try {
    issues = await ghJson([
      'search', 'issues', '--repo', repo, '--author', owner,
      '--created', window, '--limit', '100',
      '--json', 'number,title,url,state,createdAt',
    ]) || [];
  } catch (e) {
    console.warn(`[stats]   upstream issue search failed (${repo}): ${errText(e)}`);
  }
  return {
    repo,
    why,
    prs: prs
      .map((p) => ({ number: p.number, title: p.title, url: p.url, mergedAt: p.closedAt, week: isoWeek(p.closedAt) }))
      .sort((a, b) => b.mergedAt.localeCompare(a.mergedAt)),
    issues: issues
      .map((i) => ({ number: i.number, title: i.title, url: i.url, state: i.state, createdAt: i.createdAt, week: isoWeek(i.createdAt) }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

const upstream = [];
for (const project of upstreamProjects) {
  console.log(`[stats] ↗ ${project.repo}`);
  const entry = await fetchUpstream(project);
  // A listed repo with nothing in the window is not worth a row of its own.
  if (entry.prs.length > 0 || entry.issues.length > 0) upstream.push(entry);
}

// Fetch repos concurrently, but bounded: each repo already fans out internally
// (per-commit calls), so keep this modest to stay under GitHub's secondary rate
// limits. Results are kept in input order; failed repos are dropped.
const results = new Array(repoNames.length);
const repoConcurrency = 4;
let nextRepo = 0;
async function repoWorker() {
  while (nextRepo < repoNames.length) {
    const i = nextRepo++;
    const name = repoNames[i];
    try {
      results[i] = await fetchRepo(name);
    } catch (e) {
      console.error(`[stats] ✗ ${name}: ${errText(e)}`);
    }
  }
}
await Promise.all(Array.from({ length: repoConcurrency }, repoWorker));
const repos = results.filter(Boolean);

const sum = (key) => repos.reduce((a, r) => a + (key(r) || 0), 0);
const totals = {
  pr: {
    merged: sum((r) => r.pr.merged),
    closedUnmerged: sum((r) => r.pr.closedUnmerged),
    open: sum((r) => r.pr.open),
    total: sum((r) => r.pr.total),
  },
  commits: sum((r) => r.commits.total),
  commitsAiAssisted: sum((r) => r.commits.aiAssisted),
  locAdded: sum((r) => r.loc.added),
  locRemoved: sum((r) => r.loc.removed),
  locNet: sum((r) => r.loc.net),
  releases: sum((r) => r.releases.length),
  issuesOpened: sum((r) => r.issues.opened),
  issuesClosed: sum((r) => r.issues.closed),
  stars: sum((r) => r.stars),
  forks: sum((r) => r.forks),
  discussionsSince: sum((r) => r.discussions?.since || 0),
  discussionsTotal: sum((r) => r.discussions?.total || 0),
  discussionsAnswered: sum((r) => r.discussions?.answered || 0),
  // Unique all-contributors logins across the ecosystem (deduped by login, so a
  // person credited on several repos counts once). Only odios has the roster
  // today; this scales on its own if more repos adopt the spec.
  contributors: new Set(repos.flatMap((r) => r.contributors || [])).size,
  upstream: {
    projects: upstream.length,
    prsMerged: upstream.reduce((a, u) => a + u.prs.length, 0),
    issues: upstream.reduce((a, u) => a + u.issues.length, 0),
  },
};
const decidedTotal = totals.pr.merged + totals.pr.closedUnmerged;
totals.pr.mergeRatio = decidedTotal > 0 ? totals.pr.merged / decidedTotal : null;

const aggByWeek = {};
for (const r of repos) {
  for (const { w, c } of r.commits.byWeek) {
    aggByWeek[w] = (aggByWeek[w] || 0) + c;
  }
}
const commitsByWeek = Object.entries(aggByWeek)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([w, c]) => ({ w, c }));

// Cumulative stars timeline (needs pre-SINCE baseline + events since)
function weekEndISO(weekLabel) {
  const [y, w] = weekLabel.split('-W').map(Number);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  const end = new Date(week1Monday);
  end.setUTCDate(week1Monday.getUTCDate() + (w - 1) * 7 + 6);
  end.setUTCHours(23, 59, 59, 999);
  return end.toISOString();
}
const allStarEvents = repos.flatMap((r) => r.starEvents || []).sort();
// Guard the failure mode this series has hit twice: every stargazer call dies,
// starsByWeek is all zeros, and the chart quietly ships a flat line. Annotate so
// the run shows it instead of publishing a silent regression.
if (allStarEvents.length === 0 && totals.stars > 0) {
  const why = starDenied
    ? 'the token cannot list stargazers (needs a classic PAT with public_repo scope)'
    : 'every stargazers call came back empty';
  console.warn(
    `::warning title=Stats::no stargazer timestamps collected (${totals.stars} stars exist) — ${why}, so the cumulative-stars line will be flat`
  );
}
const preWindowStars = allStarEvents.filter((ts) => ts < SINCE_ISO).length;
const starsByWeek = commitsByWeek.map(({ w }) => {
  const end = weekEndISO(w);
  const newStars = allStarEvents.filter((ts) => ts >= SINCE_ISO && ts <= end).length;
  return { w, cumul: preWindowStars + newStars };
});
// Strip raw arrays from per-repo output (only needed for aggregation)
for (const r of repos) {
  delete r.starEvents;
  delete r.contributors;
}

const generatedAt = new Date().toISOString();

const output = {
  since: SINCE,
  generatedAt,
  owner,
  totals,
  commitsByWeek,
  starsByWeek,
  preWindowStars,
  repos,
  upstream,
};

console.log(
  `[stats] done — ${repos.length} repos, ${totals.pr.merged} merged / ${totals.pr.closedUnmerged} closed, ${totals.commits} commits, ${totals.releases} releases, ${totals.stars}⭐ ${totals.forks}🍴, upstream ${totals.upstream.prsMerged} PRs / ${totals.upstream.issues} issues in ${totals.upstream.projects} projects`
);

if (dryRun) {
  console.log(JSON.stringify(output, null, 2));
  process.exit(0);
}

writeFileSync(join(root, 'src/data/stats.json'), JSON.stringify(output));

console.log('[stats] wrote src/data/stats.json');
