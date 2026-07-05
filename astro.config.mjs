// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';
import { lastmodFor } from './src/lib/git-lastmod.mjs';
import { sidebar } from './src/data/sidebar.mjs';
import { unified } from '@astrojs/markdown-remark';
import remarkGfm from 'remark-gfm';

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.odio.love',
	markdown: {
		// Astro 6.4.x stopped applying GFM to .mdx files, breaking tables there
		// (plain .md was unaffected). Register it explicitly so MDX inherits it.
		processor: unified({ remarkPlugins: [remarkGfm] }),
	},
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
		preact(),
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
					Sidebar: './src/components/Sidebar.astro',
				},
			social: [
					{ icon: 'heart', label: 'odio.love', href: 'https://odio.love' },
					{ icon: 'comment', label: 'Forum', href: 'https://github.com/b0bbywan/odios/discussions' },
					{ icon: 'github', label: 'GitHub', href: 'https://github.com/b0bbywan/odios' },
				],
			sidebar,
		}),
		// Declaring @astrojs/sitemap ourselves makes Starlight skip its own bundled
		// one, so we can add a per-page <lastmod> from each doc's git history.
		sitemap({
			serialize(item) {
				const lastmod = lastmodFor(new URL(item.url).pathname);
				if (lastmod) item.lastmod = lastmod;
				return item;
			},
		}),
	],
});
