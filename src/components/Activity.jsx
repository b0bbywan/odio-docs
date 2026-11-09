import { useEffect, useRef, useState } from 'preact/hooks';
import { ecosystemProjects } from '../data/ecosystem.js';
import styles from './Activity.module.css';

// Client island: fetches the published stats (stats.odio.love/repos.json,
// refreshed by the Stats workflow) and renders them. Nothing imports the stats
// at build time, so the site build has no GitHub dependency and refreshed stats
// appear live without a rebuild.
const STATS_URL = 'https://stats.odio.love/repos.json';

const fmt = new Intl.NumberFormat('en-US');
const externalSet = new Set(
  ecosystemProjects.filter((p) => p.kind === 'apt-external').map((p) => p.name),
);

// Commit bars are colored by family (the `family` field in ecosystem.js), not
// per repo: 17+ distinct hues can't be told apart. The array order is the stack
// order, bottom to top, and it is what keeps the palette readable: it was picked
// with the dataviz palette validator so every pair of neighbouring families stays
// distinct on the dark surface, colorblind vision included. Install, one of the
// busiest families, sits between the closest pair (libraries yellow, disc
// orange), so those two are almost never stacked directly on each other.
// Reorder or recolor only after re-validating.
const FAMILIES = [
  { key: 'core', label: 'Core', color: '#4ea619' },
  { key: 'clients', label: 'Clients', color: '#3987e5' },
  { key: 'display', label: 'Display', color: '#d55181' },
  { key: 'libraries', label: 'Libraries', color: '#c98500' },
  { key: 'install', label: 'Install & packaging', color: '#1fa3b8' },
  { key: 'disc', label: 'Disc player', color: '#d95926' },
  { key: 'web', label: 'Web', color: '#9085e9' },
  { key: 'bridges', label: 'MPRIS bridges', color: '#a341be' },
  // Fallback for a repo missing from ecosystem.js; only drawn if one shows up.
  { key: 'other', label: 'Other', color: '#72797a' },
];
const familyIndex = new Map(FAMILIES.map((f, i) => [f.key, i]));
const repoFamily = new Map(ecosystemProjects.map((p) => [p.name, p.family]));
const familyOf = (name) => {
  const key = repoFamily.get(name);
  return FAMILIES[familyIndex.get(key) ?? FAMILIES.length - 1];
};
// Neutral: the stars line is a different measure than the commit bars, and
// amber would clash with the Libraries yellow.
const STARS = 'var(--sl-color-gray-1)';

export default function Activity() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // In dev the published URL may lag the local pipeline, so preview the
    // locally generated file (npm run stats). Production always fetches live.
    if (import.meta.env.DEV) {
      import('../data/stats.json')
        .then((m) => setStats(m.default))
        .catch((e) => setError(`local stats.json missing — run "npm run stats" (${e.message})`));
      return;
    }
    fetch(STATS_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div class={styles.activity}>
        <p class={styles.activitySub}>Activity stats are temporarily unavailable.</p>
        <p class={styles.activityFooter}>
          Could not load <a href={STATS_URL}><code>repos.json</code></a> ({error}).
        </p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div class={styles.activity}>
        <p class={styles.activitySub}>Loading activity…</p>
      </div>
    );
  }

  return <ActivityView stats={stats} />;
}

function ActivityView({ stats }) {
  const { totals, commitsByWeek, repos, upstream = [], since, generatedAt, owner } = stats;

  const sinceLabel = new Date(since).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const updatedLabel =
    new Date(generatedAt).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }) + ' UTC';

  const sorted = [...repos].sort((a, b) => b.commits.total - a.commits.total);
  const coreRepos = sorted.filter((r) => !externalSet.has(r.name));
  const externalRepos = sorted.filter((r) => externalSet.has(r.name));

  return (
    <div class={styles.activity}>
      <p class={styles.activitySub}>Activity across the ecosystem since {sinceLabel}.</p>

      <Cards totals={totals} repos={repos} />

      {commitsByWeek.length > 0 && <Chart stats={stats} />}

      <h3>By repository</h3>
      <RepoTable repos={coreRepos} owner={owner} />

      {externalRepos.length > 0 && (
        <>
          <h3>External, packaged for apt.odio.love</h3>
          <p class={`${styles.activitySub} ${styles.externalNote}`}>
            Forks and build pipelines we host on apt only. Source lives upstream; activity here is mostly tag bumps and packaging changes.
          </p>
          <RepoTable repos={externalRepos} owner={owner} />
        </>
      )}

      {upstream.length > 0 && (
        <>
          <h3>Upstream contributions</h3>
          <p class={styles.activitySub}>
            Fixes and reports sent to the projects odio builds on.
          </p>
          <UpstreamList projects={upstream} />
        </>
      )}

      <p class={styles.activityFooter}>
        Updated {updatedLabel}. Raw data:{' '}
        <a href={STATS_URL}><code>stats.odio.love/repos.json</code></a>.{' '}
        Regenerate with <code>npm run stats</code>.
      </p>
    </div>
  );
}

function Cards({ totals, repos }) {
  const stableReleaseCount = repos.reduce(
    (a, r) => a + r.releases.filter((rel) => !rel.prerelease).length,
    0,
  );
  const mergeRatioPct =
    totals.pr.mergeRatio != null ? Math.round(totals.pr.mergeRatio * 100) : null;

  const cards = [
    { value: fmt.format(totals.commits), label: 'commits', sub: null },
    {
      value: fmt.format(totals.pr.merged),
      label: mergeRatioPct != null ? `${mergeRatioPct}% merged` : 'merged',
      sub:
        mergeRatioPct != null
          ? [`${totals.pr.closedUnmerged} closed · ${totals.pr.open} open`]
          : null,
    },
    {
      value: fmt.format(stableReleaseCount),
      label: 'releases',
      sub:
        stableReleaseCount !== totals.releases
          ? [`${fmt.format(totals.releases)} total`]
          : null,
    },
    {
      value: `+${fmt.format(totals.locNet)}`,
      label: 'net LoC',
      sub: [`+${fmt.format(totals.locAdded)} / −${fmt.format(totals.locRemoved)}`],
    },
    {
      value: fmt.format(totals.issuesOpened),
      label: 'issues',
      sub: totals.issuesClosed > 0 ? [`${totals.issuesClosed} closed`] : null,
    },
    {
      value: fmt.format(totals.discussionsSince || 0),
      label: 'discussions',
      sub:
        (totals.discussionsAnswered || 0) > 0
          ? [`${totals.discussionsAnswered} answered`]
          : null,
    },
    totals.contributors != null
      ? { value: fmt.format(totals.contributors), label: 'contributors', sub: ['all kinds of help'] }
      : null,
    totals.upstream?.prsMerged > 0
      ? {
          value: fmt.format(totals.upstream.prsMerged),
          label: 'upstream PRs',
          sub: [`${totals.upstream.projects} projects · ${totals.upstream.issues} issues`],
        }
      : null,
    {
      value: `${fmt.format(totals.stars)} ★`,
      label: 'stars',
      sub: [`${fmt.format(totals.forks)} forks`],
    },
  ].filter(Boolean);

  return (
    <div class={`${styles.kpiGrid} not-content`}>
      {cards.map((card) => (
        <div class={styles.kpi}>
          <div class={styles.kpiValue}>{card.value}</div>
          <div class={styles.kpiLabel}>{card.label}</div>
          {card.sub && (
            <div class={styles.kpiSub}>
              {card.sub.map((line) => <div>{line}</div>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function UpstreamList({ projects }) {
  return (
    <div class={`${styles.upstream} not-content`}>
      {projects.map((p) => {
        // One list per project, newest first, PRs and issues interleaved by date.
        const items = [
          ...p.prs.map((i) => ({ ...i, kind: 'PR', date: i.mergedAt })),
          ...p.issues.map((i) => ({ ...i, kind: 'issue', date: i.createdAt })),
        ].sort((a, b) => b.date.localeCompare(a.date));
        return (
          <div class={styles.upstreamProject}>
            <div class={styles.upstreamHead}>
              <a
                class={styles.upstreamRepo}
                href={`https://github.com/${p.repo}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {p.repo}
              </a>
              <span class={styles.upstreamWhy}>{p.why}</span>
            </div>
            <ul class={styles.upstreamItems}>
              {items.map((i) => (
                <li>
                  <span class={styles.upstreamKind}>{i.kind}</span>
                  <a href={i.url} target="_blank" rel="noopener noreferrer">
                    #{i.number}
                  </a>
                  <span class={styles.upstreamTitle}>{i.title}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function RepoTable({ repos, owner }) {
  return (
    <div class={styles.tableWrap}>
      <table class={styles.activityTable}>
        <thead>
          <tr>
            <th>repo</th>
            <th class={styles.num}>★</th>
            <th class={styles.num}>⑂</th>
            <th class={styles.num}>PRs</th>
            <th>merge</th>
            <th class={styles.num}>commits</th>
            <th class={styles.num}>LoC +/−</th>
            <th>latest release</th>
          </tr>
        </thead>
        <tbody>
          {repos.map((r) => {
            const ratio = r.pr.mergeRatio;
            const pct = ratio != null ? Math.round(ratio * 100) : null;
            return (
              <tr>
                <td class={styles.repoCell}>
                  <a href={`https://github.com/${owner}/${r.name}`} target="_blank" rel="noopener noreferrer">
                    {r.name}
                  </a>
                </td>
                <td class={styles.num}>{r.stars}</td>
                <td class={styles.num}>{r.forks}</td>
                <td class={styles.num}>{r.pr.merged}/{r.pr.total}</td>
                <td>
                  {pct != null ? (
                    <div class={styles.barWrap}>
                      <div class={styles.barTrack}>
                        <div class={styles.barFill} style={`width: ${pct}%`} />
                      </div>
                      <span class={styles.barPct}>{pct}%</span>
                    </div>
                  ) : (
                    <span class={styles.muted}>—</span>
                  )}
                </td>
                <td class={styles.num}>{r.commits.total}</td>
                <td class={styles.num}>
                  <div class={styles.locAdded}>+{fmt.format(r.loc.added)}</div>
                  <div class={styles.locRemoved}>−{fmt.format(r.loc.removed)}</div>
                </td>
                <td>
                  {r.latestRelease ? (
                    <a
                      href={`https://github.com/${owner}/${r.name}/releases/tag/${r.latestRelease.tag}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      class={styles.releaseLink}
                    >
                      <span class={styles.releaseTag}>{r.latestRelease.tag}</span>
                      <span class={styles.releaseDate}>{r.latestRelease.date}</span>
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Chart({ stats }) {
  const { commitsByWeek, starsByWeek = [], repos, upstream = [] } = stats;
  const chartRef = useRef(null);
  const [tip, setTip] = useState(null);
  // null = everything, otherwise { kind: 'repo' | 'family', key }.
  const [focus, setFocus] = useState(null);

  const chartW = 960, chartH = 240, padL = 40, padR = 44, padT = 20, padB = 32;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const starsSeries = starsByWeek.filter((s) => commitsByWeek.some((c) => c.w === s.w));
  const byWeekMap = new Map(starsSeries.map((s) => [s.w, s.cumul]));

  // Grouped by family (stack order), busiest repo first inside a family.
  const activeRepos = repos
    .filter((r) => r.commits.total > 0 && !externalSet.has(r.name))
    .slice()
    .sort(
      (a, b) =>
        familyIndex.get(familyOf(a.name).key) - familyIndex.get(familyOf(b.name).key) ||
        b.commits.total - a.commits.total,
    );
  const repoWeekMap = new Map(
    activeRepos.map((r) => [r.name, new Map(r.commits.byWeek.map((d) => [d.w, d.c]))]),
  );
  const legendGroups = FAMILIES.map((f) => ({
    ...f,
    repos: activeRepos.filter((r) => familyOf(r.name).key === f.key),
  })).filter((g) => g.repos.length);

  const inFocus = (name) =>
    !focus ||
    (focus.kind === 'repo' ? focus.key === name : familyOf(name).key === focus.key);
  const shownRepos = activeRepos.filter((r) => inFocus(r.name));
  const toggleFocus = (kind, key) => {
    setTip(null);
    setFocus((f) => (f && f.kind === kind && f.key === key ? null : { kind, key }));
  };

  // Stars and upstream marks are global (no per-repo history), so they only
  // show on the unfiltered view.
  const showGlobal = !focus;

  // Upstream contributions land on the same ISO weeks as the commit bars (the
  // stats script stamps them), so they can be marked above the plot without
  // touching the commit series, which only counts repos we own.
  const upstreamByWeek = new Map();
  for (const project of upstream) {
    for (const item of [...project.prs, ...project.issues]) {
      if (!item.week) continue;
      if (!upstreamByWeek.has(item.week)) upstreamByWeek.set(item.week, []);
      upstreamByWeek.get(item.week).push(`${project.repo} #${item.number}`);
    }
  }
  const hasUpstreamMarks = commitsByWeek.some((d) => upstreamByWeek.has(d.w));

  // The scale follows what is drawn, so a single repo fills the plot height.
  const weekTotal = (w) =>
    shownRepos.reduce((sum, r) => sum + (repoWeekMap.get(r.name).get(w) || 0), 0);
  const maxC = Math.max(1, ...commitsByWeek.map((d) => weekTotal(d.w)));
  const maxS = Math.max(1, ...starsSeries.map((d) => d.cumul));
  const barGap = 3;
  const barW = commitsByWeek.length
    ? Math.max(2, (innerW - (commitsByWeek.length - 1) * barGap) / commitsByWeek.length)
    : 0;

  const yCommit = (v) => padT + innerH - (v / maxC) * innerH;
  const yStar = (v) => padT + innerH - (v / maxS) * innerH;
  const commitTicks = [0, Math.ceil(maxC / 2), maxC];
  const starTicks = [0, Math.ceil(maxS / 2), maxS];

  const starPath = commitsByWeek
    .map((d, i) => {
      const cx = padL + i * (barW + barGap) + barW / 2;
      const cy = yStar(byWeekMap.get(d.w) ?? 0);
      return `${i === 0 ? 'M' : 'L'}${cx.toFixed(1)},${cy.toFixed(1)}`;
    })
    .join(' ');

  const focusRepo = focus?.kind === 'repo' ? repos.find((r) => r.name === focus.key) : null;
  const focusLabel = focus
    ? focus.kind === 'repo'
      ? focus.key
      : FAMILIES[familyIndex.get(focus.key)].label
    : null;
  const focusCommits = shownRepos.reduce((sum, r) => sum + r.commits.total, 0);

  const showTip = (e, repo, week, count, color) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const box = chartRef.current.getBoundingClientRect();
    setTip({
      repo,
      week,
      count,
      color,
      left: rect.left + rect.width / 2 - box.left,
      top: rect.top - box.top,
    });
  };

  return (
    <div class={styles.chartBlock}>
      <h3>Commits per week</h3>
      <div class={styles.chartBox} ref={chartRef}>
        <div
          class={`${styles.tooltip} ${tip ? styles.tooltipVisible : ''}`}
          style={tip ? `left: ${tip.left}px; top: ${tip.top}px;` : ''}
        >
          {tip && (
            <>
              <span
                style={`display:inline-block;width:8px;height:8px;background:${tip.color};border-radius:2px;margin-right:6px;vertical-align:middle;`}
              />
              <strong>{tip.repo}</strong>
              <span style="opacity:0.7;"> · {tip.week}</span>
              <br />
              <span style="color:#5ab81e;">{tip.count} commits</span>
            </>
          )}
        </div>
        <div class={`${styles.focusBar} not-content`} aria-live="polite">
          {focus ? (
            <>
              <span>
                <strong>{focusLabel}</strong> · {fmt.format(focusCommits)} commits
                {focusRepo ? ` · ${fmt.format(focusRepo.stars)} ★` : ''}
              </span>
              <button type="button" class={styles.focusReset} onClick={() => setFocus(null)}>
                show all
              </button>
            </>
          ) : (
            <span>Click a repo or a family below to show only its commits.</span>
          )}
        </div>
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={
            focus
              ? `Commits per week for ${focusLabel}`
              : 'Commits per week chart with cumulative stars overlay'
          }
        >
          {commitTicks.map((t) => (
            <g>
              <line
                x1={padL}
                x2={chartW - padR}
                y1={yCommit(t)}
                y2={yCommit(t)}
                stroke="var(--sl-color-gray-4)"
                stroke-dasharray="2,3"
              />
              <text
                x={padL - 8}
                y={yCommit(t)}
                text-anchor="end"
                dominant-baseline="middle"
                class={styles.axisLabel}
              >
                {t}
              </text>
            </g>
          ))}
          {showGlobal &&
            starTicks.map((t) => (
              <text
                x={chartW - padR + 8}
                y={yStar(t)}
                text-anchor="start"
                dominant-baseline="middle"
                class={`${styles.axisLabel} ${styles.axisLabelStars}`}
              >
                {t}★
              </text>
            ))}
          {commitsByWeek.map((d, i) => {
            const x = padL + i * (barW + barGap);
            let cumul = 0;
            return (
              <g>
                {shownRepos.map((r) => {
                  const c = repoWeekMap.get(r.name).get(d.w) || 0;
                  if (c === 0) return null;
                  const h = (c / maxC) * innerH;
                  const y = padT + innerH - ((cumul + c) / maxC) * innerH;
                  cumul += c;
                  const col = familyOf(r.name).color;
                  // The surface-colored stroke separates repos inside a family.
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={barW}
                      height={h}
                      fill={col}
                      stroke="var(--sl-color-gray-5)"
                      stroke-width="1"
                      onMouseEnter={(e) => showTip(e, r.name, d.w, c, col)}
                      onMouseLeave={() => setTip(null)}
                      onClick={() => toggleFocus('repo', r.name)}
                      style="cursor:pointer;"
                    >
                      <title>{`${r.name} — ${d.w}: ${c} commits`}</title>
                    </rect>
                  );
                })}
              </g>
            );
          })}
          {showGlobal && (
            <path
              d={starPath}
              fill="none"
              stroke={STARS}
              stroke-width="2"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
          )}
          {showGlobal &&
            commitsByWeek.map((d, i) => {
              const cx = padL + i * (barW + barGap) + barW / 2;
              const cy = yStar(byWeekMap.get(d.w) ?? 0);
              return (
                <circle cx={cx} cy={cy} r={2.5} fill={STARS}>
                  <title>{`${d.w}: ${byWeekMap.get(d.w) ?? 0} total stars`}</title>
                </circle>
              );
            })}
          {showGlobal &&
            commitsByWeek.map((d, i) => {
              const marks = upstreamByWeek.get(d.w);
              if (!marks) return null;
              const cx = padL + i * (barW + barGap) + barW / 2;
              return (
                <g>
                  <title>{`${d.w} — upstream: ${marks.join(', ')}`}</title>
                  <path
                    d={`M${cx.toFixed(1)},${padT - 16} L${(cx + 4).toFixed(1)},${padT - 12} L${cx.toFixed(1)},${padT - 8} L${(cx - 4).toFixed(1)},${padT - 12} Z`}
                    fill="var(--sl-color-white)"
                  />
                </g>
              );
            })}
          {commitsByWeek.map((d, i) =>
            i % 4 === 0 || i === commitsByWeek.length - 1 ? (
              <text
                x={padL + i * (barW + barGap) + barW / 2}
                y={chartH - padB + 14}
                text-anchor="middle"
                class={styles.axisLabel}
              >
                {d.w.slice(5)}
              </text>
            ) : null,
          )}
        </svg>
        <div class={`${styles.legend} not-content`}>
          {legendGroups.map((g) => (
            <div class={styles.legendGroup}>
              <button
                type="button"
                class={`${styles.legendFamily} ${focus && !(focus.kind === 'family' && focus.key === g.key) ? styles.legendDim : ''}`}
                aria-pressed={focus?.kind === 'family' && focus.key === g.key}
                onClick={() => toggleFocus('family', g.key)}
              >
                <span class={styles.legendSwatch} style={`background-color: ${g.color};`} />
                {g.label}
              </button>
              {g.repos.map((r) => (
                <button
                  type="button"
                  class={`${styles.legendRepo} ${inFocus(r.name) ? '' : styles.legendDim}`}
                  aria-pressed={focus?.kind === 'repo' && focus.key === r.name}
                  onClick={() => toggleFocus('repo', r.name)}
                >
                  {r.name}
                </button>
              ))}
            </div>
          ))}
          {showGlobal && (
            <div class={styles.legendGroup}>
              <span class={styles.legendItem}>
                <span class={styles.legendLine} />
                cumulative stars
              </span>
              {hasUpstreamMarks && (
                <span class={styles.legendItem}>
                  <span class={styles.legendDiamond} />
                  upstream contribution
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
