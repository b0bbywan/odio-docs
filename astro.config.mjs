// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.odio.love',
	integrations: [
		starlight({
			title: 'odio docs',
				logo: {
					src: './src/assets/logo.svg',
					alt: 'odio',
				},
				favicon: '/favicon.svg',
				customCss: ['./src/styles/custom.css'],
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/b0bbywan/odios' }],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Installation', slug: 'guides/installation' },
						{ label: 'How it works', slug: 'guides/how-it-works' },
					],
				},
				{
					label: 'Control',
					items: [
						{ label: 'Embedded web UI', slug: 'guides/embedded-ui' },
						{ label: 'Application', slug: 'guides/pwa' },
						{ label: 'Home Assistant', slug: 'guides/home-assistant' },
					],
				},
				{
					label: 'Features',
					items: [
						{ label: 'Network audio (TCP sink)', slug: 'guides/network-audio' },
						{ label: 'Bluetooth', slug: 'guides/bluetooth' },
						{ label: 'MPD', slug: 'guides/mpd' },
						{ label: 'Audio CD', slug: 'guides/audio-cd' },
						{ label: 'USB flash drives', slug: 'guides/usb-flashdrives' },
						{ label: 'UPnP / DLNA', slug: 'guides/dlna' },
						{ label: 'AirPlay', slug: 'guides/airplay' },
						{ label: 'Multi-room (Snapcast)', slug: 'guides/snapcast' },
						{ label: 'Spotify Connect', slug: 'guides/spotify' },
						{ label: 'Tidal & Qobuz', slug: 'guides/tidal-qobuz' },
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
			],
		}),
	],
});
