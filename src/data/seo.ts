import stats from './stats.json';

export const SITE_URL = 'https://odio.love';
export const DOCS_URL = 'https://docs.odio.love';

export const DEFAULT_TITLE = 'odio docs';
export const DEFAULT_DESCRIPTION =
	'Documentation for odio, the open-source Raspberry Pi audio streamer.';

export const OG_IMAGE = `${SITE_URL}/og-cover.png`;
export const OG_IMAGE_ALT =
	'odio dashboard: AirPlay 2, Spotify, Snapcast, Bluetooth services on a Raspberry Pi';
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export interface SchemaIdRef {
	'@id': string;
}

export const ORG_REF: SchemaIdRef = { '@id': `${SITE_URL}/#organization` };
export const OS_REF: SchemaIdRef = { '@id': `${SITE_URL}/#os` };
export const WEBSITE_REF: SchemaIdRef = { '@id': `${DOCS_URL}/#website` };

export const SOCIALS = [
	'https://www.linkedin.com/in/mrequillart/',
	'https://mathieu-requillart.medium.com/',
];

const ORG_SAMEAS = ['https://github.com/b0bbywan', DOCS_URL, ...SOCIALS];

export const AUTHOR = {
	'@type': 'Person' as const,
	name: 'b0bbywan',
	url: 'https://github.com/b0bbywan',
	sameAs: SOCIALS,
};

const SCREENSHOTS = [
	'audio-cd-playback.png',
	'bt-playing.png',
	'embedded-ui.png',
	'odio-ha.png',
	'pwa-instances.png',
	'rpi-imager.png',
].map((f) => `${SITE_URL}/screenshots/${f}`);

interface StatsRelease {
	tag: string;
	prerelease: boolean;
}
interface StatsRepo {
	name: string;
	releases?: StatsRelease[];
}

function latestStableRelease(repo: string): string | undefined {
	const r = (stats.repos as StatsRepo[]).find((x) => x.name === repo);
	return r?.releases?.find((rel) => !rel.prerelease)?.tag;
}

const ODIOS_VERSION = latestStableRelease('odios');

const KEYWORDS = [
	'Raspberry Pi audio streamer',
	'self-hosted',
	'open-source',
	'Home Assistant',
	'AirPlay 2',
	'Bluetooth audio',
	'Snapcast multi-room',
	'UPnP DLNA',
	'Spotify Connect',
	'Tidal',
	'Qobuz',
	'MPD',
	'CD auto-play',
	'USB auto-play',
	'GnuDB',
	'MusicBrainz',
	'cover art',
	'no telemetry',
	'Volumio alternative',
];

export function buildSiteGraph() {
	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'Organization',
				'@id': ORG_REF['@id'],
				name: 'odio',
				url: SITE_URL,
				logo: {
					'@type': 'ImageObject',
					url: `${SITE_URL}/logo.png`,
				},
				description:
					'Open-source Raspberry Pi audio streaming project: self-hosted, Home Assistant native, no telemetry.',
				founder: AUTHOR,
				contactPoint: {
					'@type': 'ContactPoint',
					contactType: 'customer support',
					email: 'contact@odio.love',
					url: 'https://github.com/b0bbywan/odios/issues',
					availableLanguage: ['English', 'French'],
				},
				sameAs: ORG_SAMEAS,
			},
			{
				'@type': 'WebSite',
				'@id': WEBSITE_REF['@id'],
				name: 'odio docs',
				url: DOCS_URL,
				description: DEFAULT_DESCRIPTION,
				inLanguage: 'en',
				publisher: ORG_REF,
			},
			{
				'@type': 'OperatingSystem',
				'@id': OS_REF['@id'],
				name: 'odio',
				url: SITE_URL,
				applicationCategory: 'MultimediaApplication',
				applicationSubCategory: 'Audio Streaming',
				operatingSystem: 'Raspberry Pi OS Lite (Trixie), Debian 13',
				processorRequirements: 'ARMv6, ARMv7, ARM64 (aarch64), x86-64',
				softwareRequirements:
					'Raspberry Pi OS Lite (Trixie) or Debian 13; bare-metal install via curl',
				sameAs: ['https://github.com/b0bbywan/odios'],
				downloadUrl: `${SITE_URL}/install`,
				installUrl: `${SITE_URL}/install`,
				softwareHelp: {
					'@type': 'CreativeWork',
					url: DOCS_URL,
				},
				releaseNotes: 'https://github.com/b0bbywan/odios/releases',
				license: 'https://opensource.org/licenses/BSD-2-Clause',
				...(ODIOS_VERSION ? { softwareVersion: ODIOS_VERSION } : {}),
				screenshot: SCREENSHOTS,
				keywords: KEYWORDS,
				author: AUTHOR,
				publisher: ORG_REF,
				offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
			},
		],
	};
}

export interface BreadcrumbItem {
	label: string;
	href?: string;
}

export function buildBreadcrumbSchema(trail: BreadcrumbItem[]) {
	if (trail.length === 0) return null;
	const home = {
		'@type': 'ListItem',
		position: 1,
		name: DEFAULT_TITLE,
		item: `${DOCS_URL}/`,
	};
	const items = [
		home,
		...trail.map((it, i) => ({
			'@type': 'ListItem',
			position: i + 2,
			name: it.label,
			...(it.href ? { item: new URL(it.href, DOCS_URL).toString() } : {}),
		})),
	];
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items,
	};
}

export interface HowToEntry {
	data?: {
		title?: string;
		description?: string;
	};
}

export function buildHowToSchema(
	entry: HowToEntry | undefined,
	canonical: string,
	lastUpdated?: Date,
) {
	return {
		'@context': 'https://schema.org',
		'@type': 'HowTo',
		name: entry?.data?.title ?? 'odio guide',
		description: entry?.data?.description ?? '',
		url: canonical,
		mainEntityOfPage: canonical,
		inLanguage: 'en',
		about: OS_REF,
		author: AUTHOR,
		publisher: ORG_REF,
		...(lastUpdated ? { dateModified: lastUpdated.toISOString() } : {}),
	};
}
