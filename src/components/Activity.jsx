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

const repoColors = {
  'go-odio-api': '#5ab81e',
  'odios': '#c8943a',
  'odio-ha': '#7ab8ff',
  'odio-pwa': '#ff6a3d',
  'go-mpd-discplayer': '#9ed65e',
  'go-disc-cuer': '#4fc9a8',
  'go-odio-notify': '#b090ff',
  'mpDris2': '#d68aff',
  'snapclientmpris': '#5fc3d6',
  'odio-apt-repo': '#d9c758',
  'odio-docs': '#e38dd6',
  'odio.love': '#a09080',
};
const colorOf = (name) => repoColors[name] || '#3a7020';
const AMBER = '#c8943a';

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
  const { totals, commitsByWeek, repos, since, generatedAt, owner } = stats;

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
    {
      value: fmt.format(totals.pr.merged),
      label: 'merged',
      sub:
        mergeRatioPct != null
          ? [`${mergeRatioPct}%`, `${totals.pr.closedUnmerged} closed`, `${totals.pr.open} open`]
          : null,
    },
    { value: fmt.format(totals.commits), label: 'commits', sub: null },
    {
      value: fmt.format(totals.releases),
      label: 'releases',
      sub:
        stableReleaseCount !== totals.releases
          ? [`${fmt.format(stableReleaseCount)} stable`]
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
    { value: `${fmt.format(totals.stars)} ★`, label: 'stars', sub: null },
    { value: `${fmt.format(totals.forks)} ⑂`, label: 'forks', sub: null },
  ].filter(Boolean);

  return (
    <div class={styles.kpiGrid}>
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
  const { commitsByWeek, starsByWeek = [], repos } = stats;
  const chartRef = useRef(null);
  const [tip, setTip] = useState(null);

  const chartW = 960, chartH = 240, padL = 40, padR = 44, padT = 20, padB = 32;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const starsSeries = starsByWeek.filter((s) => commitsByWeek.some((c) => c.w === s.w));
  const byWeekMap = new Map(starsSeries.map((s) => [s.w, s.cumul]));

  const activeRepos = repos
    .filter((r) => r.commits.total > 0 && !externalSet.has(r.name))
    .slice()
    .sort((a, b) => b.commits.total - a.commits.total);
  const repoWeekMap = new Map(
    activeRepos.map((r) => [r.name, new Map(r.commits.byWeek.map((d) => [d.w, d.c]))]),
  );

  const maxC = Math.max(1, ...commitsByWeek.map((d) => d.c));
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
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Commits per week chart with cumulative stars overlay"
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
          {starTicks.map((t) => (
            <text
              x={chartW - padR + 8}
              y={yStar(t)}
              text-anchor="start"
              dominant-baseline="middle"
              class={`${styles.axisLabel} ${styles.axisLabelAmber}`}
            >
              {t}★
            </text>
          ))}
          {commitsByWeek.map((d, i) => {
            const x = padL + i * (barW + barGap);
            let cumul = 0;
            return (
              <g>
                {activeRepos.map((r) => {
                  const c = repoWeekMap.get(r.name).get(d.w) || 0;
                  if (c === 0) return null;
                  const h = (c / maxC) * innerH;
                  const y = padT + innerH - ((cumul + c) / maxC) * innerH;
                  cumul += c;
                  const col = colorOf(r.name);
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={barW}
                      height={h}
                      fill={col}
                      opacity="0.9"
                      onMouseEnter={(e) => showTip(e, r.name, d.w, c, col)}
                      onMouseLeave={() => setTip(null)}
                    >
                      <title>{`${r.name} — ${d.w}: ${c} commits`}</title>
                    </rect>
                  );
                })}
              </g>
            );
          })}
          <path
            d={starPath}
            fill="none"
            stroke={AMBER}
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
          {commitsByWeek.map((d, i) => {
            const cx = padL + i * (barW + barGap) + barW / 2;
            const cy = yStar(byWeekMap.get(d.w) ?? 0);
            return (
              <circle cx={cx} cy={cy} r={2.5} fill={AMBER}>
                <title>{`${d.w}: ${byWeekMap.get(d.w) ?? 0} total stars`}</title>
              </circle>
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
        <div class={styles.legend}>
          {activeRepos.map((r) => (
            <span class={styles.legendItem}>
              <span class={styles.legendSwatch} style={`background-color: ${colorOf(r.name)};`} />
              {r.name}
            </span>
          ))}
          <span class={styles.legendItem}>
            <span class={styles.legendLine} />
            cumulative stars
          </span>
        </div>
      </div>
    </div>
  );
}
