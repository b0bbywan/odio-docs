// Single source of truth for the sidebar: consumed by `astro.config.mjs` to build
// the Starlight sidebar, and by `CategoryCards.astro` to generate the category
// summary pages (Control, Features, Operations, Community) from the same labels,
// order, and slugs. Add a page here and it appears in both places automatically.
export const sidebar = [
	{
		label: 'Getting Started',
		items: [
			{ label: 'Installation', slug: 'operations/installation' },
			{ label: 'How it works', slug: 'operations/how-it-works' },
		],
	},
	{
		label: 'Control',
		link: '/control/',
		items: [
			{ label: 'Embedded web UI', slug: 'control/embedded-ui' },
			{ label: 'Application', slug: 'control/pwa' },
			{ label: 'Home Assistant', slug: 'control/home-assistant' },
			{ label: 'Local screen', slug: 'control/local-screen' },
			{ label: 'Remote controls', slug: 'control/remote' },
			{
				label: 'Python library (pyodio)',
				collapsed: true,
				items: [
					{ label: 'Overview', slug: 'control/pyodio' },
					{ label: 'Live state (OdioHub)', slug: 'control/pyodio/hub' },
					{ label: 'Low-level client', slug: 'control/pyodio/client' },
					{ label: 'API reference', slug: 'control/pyodio/reference' },
				],
			},
		],
	},
	{
		label: 'Features',
		link: '/features/',
		items: [
			{ label: 'Bluetooth', slug: 'guides/bluetooth' },
			{ label: 'Bluetooth output', slug: 'guides/bluetooth-output' },
			{ label: 'AirPlay', slug: 'guides/airplay' },
			{ label: 'Spotify Connect', slug: 'guides/spotify' },
			{ label: 'Qobuz Connect', slug: 'guides/qobuz-connect' },
			{ label: 'UPnP / DLNA', slug: 'guides/dlna' },
			{ label: 'Network audio (TCP sink)', slug: 'guides/network-audio' },
			{ label: 'MPD', slug: 'guides/mpd' },
			{ label: 'Audio CD', slug: 'guides/audio-cd' },
			{ label: 'USB flash drives', slug: 'guides/usb-flashdrives' },
			{ label: 'Tidal & Qobuz', slug: 'guides/tidal-qobuz' },
			{ label: 'Webradios', slug: 'guides/webradios' },
			{ label: 'Multi-room (Snapcast)', slug: 'guides/snapcast' },
		],
	},
	{
		label: 'Operations',
		link: '/operations/',
		items: [
			{ label: 'Settings', slug: 'operations/settings' },
			{ label: 'Upgrade', slug: 'operations/upgrade' },
			{ label: 'Power management', slug: 'operations/power' },
			{ label: 'APT repository', slug: 'operations/apt-repository' },
			{ label: 'Extensions', slug: 'operations/extensions' },
			{ label: 'Audio notifications', slug: 'operations/audio-notifications' },
		],
	},
	{
		label: 'Use Cases',
		items: [
			{ label: 'Overview', slug: 'guides/use-cases' },
			{ label: 'Desktop & Laptop', slug: 'guides/use-case-desktop' },
			{ label: 'HTPC', slug: 'guides/use-case-htpc' },
			{ label: 'NAS', slug: 'guides/use-case-nas' },
			{ label: 'Phone & Tablet', slug: 'guides/use-case-phone' },
			{ label: 'Navidrome', slug: 'guides/navidrome' },
			{ label: 'Music Assistant', slug: 'guides/music-assistant' },
		],
	},
	{
		label: 'API',
		items: [
			{ label: 'Overview', slug: 'api/overview' },
			{ label: 'Installation', slug: 'api/installation' },
			{ label: 'Configuration', slug: 'api/configuration' },
			{ label: 'MPRIS', slug: 'api/mpris' },
			{ label: 'PulseAudio', slug: 'api/pulseaudio' },
			{ label: 'Systemd', slug: 'api/systemd' },
			{ label: 'Bluetooth', slug: 'api/bluetooth' },
			{ label: 'Power', slug: 'api/power' },
			{ label: 'Input', slug: 'api/input' },
			{ label: 'Upgrades', slug: 'api/upgrade' },
			{ label: 'Zeroconf', slug: 'api/zeroconf' },
			{ label: 'SSE Events', slug: 'api/events' },
		],
	},
	{
		label: 'MPD Disc Player',
		items: [
			{ label: 'Overview', slug: 'disc-player/overview' },
			{ label: 'Installation', slug: 'disc-player/installation' },
			{ label: 'Configuration', slug: 'disc-player/configuration' },
			{ label: 'disc-cuer', slug: 'disc-player/disc-cuer' },
		],
	},
	{
		label: 'Audio Notifications',
		items: [
			{ label: 'Overview', slug: 'notify/overview' },
		],
	},
	{
		label: 'Community',
		link: '/community/',
		items: [
			{ label: 'Get involved', slug: 'community/get-involved' },
			{ label: 'Activity', slug: 'community/activity' },
			{ label: 'Downloads', slug: 'community/downloads' },
			{ label: 'CI/CD', slug: 'community/ci-cd' },
			{ label: 'Feature requests', slug: 'community/feature-requests' },
			{ label: 'Empowerment', slug: 'community/empowerment' },
		],
	},
];

// A group's landing page: its `link` if it has a category summary page,
// otherwise its first page (an Overview, or Installation for Getting Started).
// Starlight groups can't carry a link, so the sidebar (SidebarSublist.astro)
// uses this map to make group headers clickable, and the breadcrumb JSON-LD
// (Head.astro) uses it to give each group level a URL.
function collectGroupLinks(items, links = {}) {
	for (const item of items) {
		if (!item.items) continue;
		links[item.label] = item.link ?? `/${firstSlug(item.items)}/`;
		collectGroupLinks(item.items, links);
	}
	return links;
}

function firstSlug(items) {
	const first = items[0];
	return first.slug ?? firstSlug(first.items);
}

export const groupLinks = collectGroupLinks(sidebar);

// The sidebar as Starlight accepts it: its schema rejects the extra `link` key.
const stripLinks = (items) =>
	items.map(({ link, ...item }) => (item.items ? { ...item, items: stripLinks(item.items) } : item));

export const starlightSidebar = stripLinks(sidebar);
