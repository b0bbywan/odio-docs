import { useEffect, useState } from 'preact/hooks';
import styles from './Activity.module.css';

// Client island: fetches the published release-asset download counts
// (stats.odio.love/downloads.json, refreshed by the Stats workflow) and renders
// them. Nothing imports it at build time, so refreshed counts appear live
// without a rebuild. Shares the Activity stylesheet for a consistent look.
const DOWNLOADS_URL = 'https://stats.odio.love/downloads.json';

const fmt = new Intl.NumberFormat('en-US');

export default function Downloads() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(DOWNLOADS_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div class={styles.activity}>
        <p class={styles.activitySub}>Download stats are temporarily unavailable.</p>
        <p class={styles.activityFooter}>
          Could not load <a href={DOWNLOADS_URL}><code>downloads.json</code></a> ({error}).
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div class={styles.activity}>
        <p class={styles.activitySub}>Loading downloads…</p>
      </div>
    );
  }

  return <DownloadsView data={data} />;
}

// Collapse an asset name to a version-independent key by blanking the release
// version inside it: spotifyd_0.4.4_amd64.deb -> spotifyd_{v}_amd64.deb, so every
// per-arch .deb across releases folds into one logical asset. Names with no
// embedded version (manifest.json, install.sh) stay as-is and group by exact name.
function assetKey(name, tag) {
  const ver = (tag || '').replace(/^v/, '');
  const key = ver && name.includes(ver) ? name.split(ver).join('{v}') : name;
  // Fold renamed/variant assets onto their current name:
  //  - odios assets went from `odios-…` to `odio-…` (the binary is `odio`);
  //  - the upgrade helper went from `odio-upgrade` to `odio_upgrade.py`;
  //  - mpDris2 tarballs were lowercased to `mpdris2-…`;
  //  - spotifyd ships a default/full/slim flavor per arch, folded together.
  return key
    .replace(/^odios([-.])/, 'odio$1')
    .replace(/^odio-upgrade$/, 'odio_upgrade.py')
    .replace(/^mpDris2/, 'mpdris2')
    .replace(/-(default|full|slim)\.tar\.gz$/, '-*.tar.gz');
}

// Group a repo's release assets into logical assets, each with a per-version
// breakdown. Assets that net zero downloads are dropped to keep the table legible.
function groupAssets(repo) {
  const map = new Map();
  for (const rel of repo.releases) {
    for (const a of rel.assets) {
      const key = assetKey(a.name, rel.tag);
      let g = map.get(key);
      if (!g) {
        g = { key, label: key.split('{v}').join('*'), total: 0, versions: [] };
        map.set(key, g);
      }
      g.total += a.downloads;
      g.versions.push({ tag: rel.tag, date: rel.date, downloads: a.downloads });
    }
  }
  return [...map.values()]
    .filter((g) => g.total > 0)
    .sort((a, b) => b.total - a.total)
    .map((g) => ({
      ...g,
      versions: g.versions.sort((x, y) => (y.date || '').localeCompare(x.date || '')),
    }));
}

function DownloadsView({ data }) {
  const { total, repos, owner, generatedAt } = data;

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

  const sorted = [...repos].sort((a, b) => b.total - a.total);
  const releaseCount = repos.reduce((a, r) => a + r.releases.length, 0);

  return (
    <div class={styles.activity}>
      <p class={styles.activitySub}>Release-asset downloads per repository, from the GitHub API.</p>

      <div class={styles.kpiGrid}>
        <Kpi value={fmt.format(total)} label="downloads" />
        <Kpi value={fmt.format(sorted.length)} label="repos with assets" />
        <Kpi value={fmt.format(releaseCount)} label="releases" />
      </div>

      {sorted.map((r, i) => (
        <RepoBlock repo={r} owner={owner} defaultOpen={i === 0} />
      ))}

      <p class={styles.activityFooter}>
        Updated {updatedLabel}. Raw data:{' '}
        <a href={DOWNLOADS_URL}><code>stats.odio.love/downloads.json</code></a>.{' '}
        Regenerate with <code>npm run downloads</code>.
      </p>
    </div>
  );
}

function RepoBlock({ repo, owner, defaultOpen }) {
  const assets = groupAssets(repo);
  const maxTotal = Math.max(1, ...assets.map((a) => a.total));

  return (
    <details class={styles.repoDetails} open={defaultOpen}>
      <summary class={styles.repoSummary}>
        <a
          class={styles.repoName}
          href={`https://github.com/${owner}/${repo.name}/releases`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {repo.name}
        </a>
        <span class={styles.repoMeta}>
          {fmt.format(repo.total)} downloads · {assets.length} assets · {repo.releases.length} releases
        </span>
      </summary>

      <div class={styles.repoTableWrap}>
        <table class={styles.activityTable}>
          <thead>
            <tr>
              <th>asset</th>
              <th class={styles.num}>versions</th>
              <th class={styles.num}>downloads</th>
              <th>share</th>
            </tr>
          </thead>
          {assets.map((a) => (
            <AssetRows asset={a} owner={owner} repo={repo.name} max={maxTotal} />
          ))}
        </table>
      </div>
    </details>
  );
}

function AssetRows({ asset, owner, repo, max }) {
  const [open, setOpen] = useState(false);
  const pct = Math.round((asset.total / max) * 100);

  return (
    <tbody>
      <tr
        class={styles.assetRow}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style="cursor: pointer"
      >
        <td class={styles.repoCell}>
          <span class={styles.muted}>{open ? '▾' : '▸'}</span> {asset.label}
        </td>
        <td class={styles.num}>{asset.versions.length}</td>
        <td class={styles.num}>{fmt.format(asset.total)}</td>
        <td>
          <div class={styles.barWrap}>
            <div class={styles.barTrack}>
              <div class={styles.barFill} style={`width: ${pct}%`} />
            </div>
          </div>
        </td>
      </tr>
      {open &&
        asset.versions.map((v) => (
          <tr class={styles.versionRow}>
            <td class={styles.repoCell} style="padding-left: 2rem">
              <a
                class={styles.releaseLink}
                href={`https://github.com/${owner}/${repo}/releases/tag/${v.tag}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span class={styles.releaseTag}>{v.tag}</span>
                {v.date && <span class={styles.releaseDate}>{v.date}</span>}
              </a>
            </td>
            <td />
            <td class={styles.num}>{fmt.format(v.downloads)}</td>
            <td />
          </tr>
        ))}
    </tbody>
  );
}

function Kpi({ value, label }) {
  return (
    <div class={styles.kpi}>
      <div class={styles.kpiValue}>{value}</div>
      <div class={styles.kpiLabel}>{label}</div>
    </div>
  );
}
