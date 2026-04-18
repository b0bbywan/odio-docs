import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

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
const repoNames = [
  ...new Set(
    [...ecosystemSrc.matchAll(new RegExp(`github\\.com/${owner}/([a-z0-9.-]+)`, 'gi'))].map(
      (m) => m[1].replace(/\.git$/, '')
    )
  ),
];

console.log(`[stats] ${repoNames.length} repos since ${SINCE}: ${repoNames.join(', ')}`);

async function gh(argv) {
  const { stdout } = await exec('gh', argv, { maxBuffer: 100 * 1024 * 1024 });
  return stdout;
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
    '{stars: .stargazers_count, forks: .forks_count, description: .description, updatedAt: .updated_at, archived: .archived, defaultBranch: .default_branch}',
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
    console.warn(`[stats]   pr list failed: ${e.message.split('\n')[0]}`);
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
    console.warn(`[stats]   issue list failed: ${e.message.split('\n')[0]}`);
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
    console.warn(`[stats]   release list failed: ${e.message.split('\n')[0]}`);
  }

  let commits = [];
  try {
    commits = await ghApiPaginateArray(
      `/repos/${repo}/commits?since=${encodeURIComponent(SINCE_ISO)}&per_page=100`
    );
  } catch (e) {
    console.warn(`[stats]   commits failed: ${e.message.split('\n')[0]}`);
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
  try {
    freq = await ghJson(['api', `/repos/${repo}/stats/code_frequency`]);
  } catch {}
  if (Array.isArray(freq) && freq.length > 0) {
    for (const [ts, add, rem] of freq) {
      if (ts >= SINCE_TS) {
        locAdded += add;
        locRemoved += Math.abs(rem);
      }
    }
  } else if (commits.length > 0) {
    // Fallback: walk each commit's stats individually (N+1 calls, rate-limit friendly)
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
    console.log(`[stats]   loc via per-commit fallback (${done}/${commits.length})`);
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
    console.warn(`[stats]   discussions failed: ${e.message.split('\n')[0]}`);
  }

  // Stargazers with timestamps (for time-series chart)
  let starEvents = [];
  try {
    const out = await gh([
      'api',
      `/repos/${repo}/stargazers`,
      '--paginate',
      '-H',
      'Accept: application/vnd.github.v3.star+json',
      '--jq',
      '.[].starred_at',
    ]);
    starEvents = out.trim().split('\n').filter(Boolean);
  } catch (e) {
    console.warn(`[stats]   stargazers failed: ${e.message.split('\n')[0]}`);
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
  };
}

const repos = [];
for (const name of repoNames) {
  try {
    repos.push(await fetchRepo(name));
  } catch (e) {
    console.error(`[stats] ✗ ${name}: ${e.message.split('\n')[0]}`);
  }
}

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
const preWindowStars = allStarEvents.filter((ts) => ts < SINCE_ISO).length;
const starsByWeek = commitsByWeek.map(({ w }) => {
  const end = weekEndISO(w);
  const newStars = allStarEvents.filter((ts) => ts >= SINCE_ISO && ts <= end).length;
  return { w, cumul: preWindowStars + newStars };
});
// Strip raw event arrays from per-repo output (only needed for aggregation)
for (const r of repos) delete r.starEvents;

const generatedAt = new Date().toISOString();
let ghVersion = 'unknown';
try {
  ghVersion = (await gh(['--version'])).split('\n')[0].trim();
} catch {}

const output = {
  since: SINCE,
  generatedAt,
  owner,
  totals,
  commitsByWeek,
  starsByWeek,
  preWindowStars,
  repos,
};

const meta = { generatedAt, since: SINCE, ghVersion };

console.log(
  `[stats] done — ${repos.length} repos, ${totals.pr.merged} merged / ${totals.pr.closedUnmerged} closed, ${totals.commits} commits, ${totals.releases} releases, ${totals.stars}⭐ ${totals.forks}🍴`
);

if (dryRun) {
  console.log(JSON.stringify(output, null, 2));
  process.exit(0);
}

writeFileSync(join(root, 'src/data/stats.json'), JSON.stringify(output));
writeFileSync(join(root, 'src/data/stats.meta.json'), JSON.stringify(meta));

const historyPath = join(root, 'src/data/stats.history.json');
let history = [];
if (existsSync(historyPath)) {
  try {
    history = JSON.parse(readFileSync(historyPath, 'utf8'));
  } catch {
    history = [];
  }
}
history.push({
  date: generatedAt,
  totals: { stars: totals.stars, forks: totals.forks },
  perRepo: Object.fromEntries(repos.map((r) => [r.name, { stars: r.stars, forks: r.forks }])),
});
writeFileSync(historyPath, JSON.stringify(history));

console.log('[stats] wrote src/data/stats.json, stats.meta.json, stats.history.json');
