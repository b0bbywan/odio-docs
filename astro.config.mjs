// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.odio.love',
	redirects: {
		'/guides/upgrade': '/operations/upgrade',
		'/guides/power': '/operations/power',
		'/guides/extensions': '/operations/extensions',
		'/guides/audio-notifications': '/operations/audio-notifications',
		'/guides/installation': '/operations/installation',
		'/guides/how-it-works': '/operations/how-it-works',
		'/guides/embedded-ui': '/control/embedded-ui',
		'/guides/pwa': '/control/pwa',
		'/guides/home-assistant': '/control/home-assistant',
	},
	integrations: [
		starlight({
			title: 'odio docs',
				logo: {
					src: './src/assets/logo.svg',
					alt: 'odio',
				},
				favicon: '/favicon.svg',
				lastUpdated: true,
				customCss: ['./src/styles/custom.css'],
				head: [
					{ tag: 'script', attrs: { src: '/screenshot-lightbox.js', defer: true } },
				],
				components: {
					SocialIcons: './src/components/SocialIcons.astro',
					Head: './src/components/Head.astro',
				},
			social: [
					{ icon: 'heart', label: 'odio.love', href: 'https://odio.love' },
					{ icon: 'comment', label: 'Forum', href: 'https://github.com/b0bbywan/odios/discussions' },
					{ icon: 'github', label: 'GitHub', href: 'https://github.com/b0bbywan/odios' },
				],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Installation', slug: 'operations/installation' },
						{ label: 'How it works', slug: 'operations/how-it-works' },
					],
				},
				{
					label: 'Control',
					items: [
						{ label: 'Embedded web UI', slug: 'control/embedded-ui' },
						{ label: 'Application', slug: 'control/pwa' },
						{ label: 'Home Assistant', slug: 'control/home-assistant' },
					],
				},
				{
					label: 'Features',
					items: [
						{ label: 'Bluetooth', slug: 'guides/bluetooth' },
						{ label: 'AirPlay', slug: 'guides/airplay' },
						{ label: 'Spotify Connect', slug: 'guides/spotify' },
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
					items: [
						{ label: 'Upgrade', slug: 'operations/upgrade' },
						{ label: 'Power management', slug: 'operations/power' },
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
						{ label: 'Bluetooth output', slug: 'guides/bluetooth-output' },
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
					items: [
						{ label: 'Get involved', slug: 'community/get-involved' },
						{ label: 'Activity', slug: 'community/activity' },
						{ label: 'CI/CD', slug: 'community/ci-cd' },
						{ label: 'Feature requests', slug: 'community/feature-requests' },
						{ label: 'Empowerment', slug: 'community/empowerment' },
					],
				},
			],
		}),
	],
});
