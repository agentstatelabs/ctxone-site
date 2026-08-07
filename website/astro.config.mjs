// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	// Canonical URL for sitemaps, OG tags, and all /absolute links.
	site: 'https://ctxone.com',

	integrations: [
		starlight({
			title: 'CTXone',
			description:
				'The self-hosted context engine for AI agents — durable memory, plans, branches, and provenance across every tool you use. MCP-native, zero telemetry.',
			// The landing page lives in src/pages/index.astro — not a
			// Starlight doc. We need Starlight to NOT claim the site root.
			// Its built-in docs land under paths like /getting-started/*.
			logo: {
				src: './src/assets/ctxone-wordmark.svg',
				replacesTitle: true,
			},
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/AgentStateLabs/CTXone',
				},
			],
			customCss: ['./src/styles/global.css', './src/styles/theme.css'],
			sidebar: [
				{
					label: 'Getting started',
					items: [
						{ label: 'Quickstart', slug: 'getting-started/quickstart' },
						{ label: 'Walkthrough', slug: 'getting-started/walkthrough' },
						{ label: 'Windows', slug: 'getting-started/windows' },
					],
				},
				{
					label: 'Company',
					items: [
						{ label: 'Blog', link: '/blog/' },
						{ label: 'Team & Enterprise', link: '/editions/' },
					],
				},
				{
					label: 'How it works',
					items: [
						{ label: 'Architecture', slug: 'how-it-works/architecture' },
						{ label: 'Token savings', slug: 'how-it-works/token-savings' },
						{
							label: 'Memory MCP design',
							slug: 'how-it-works/memory-mcp-design',
						},
						{
							label: 'Memory branch scoping',
							slug: 'how-it-works/memory-branch-scoping',
						},
						{
							label: 'Agent structure',
							slug: 'how-it-works/agent-structure',
						},
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'Features & commands', slug: 'reference/features' },
						{ label: 'CLI', slug: 'reference/cli' },
						{ label: 'MCP tools', slug: 'reference/mcp-tools' },
						{ label: 'HTTP API', slug: 'reference/http-api' },
						{ label: 'Agent guidance', slug: 'reference/agent-guidance' },
					],
				},
				{
					label: 'Integrations',
					items: [
						{
							label: 'AI coding tools',
							slug: 'integrations/ai-coding-tools',
						},
						{ label: 'Open WebUI', slug: 'integrations/open-webui' },
						{
							label: 'ASD code intelligence',
							slug: 'integrations/asd-integration',
						},
						{ label: 'Rust', slug: 'integrations/rust' },
					],
				},
				{
					label: 'Operating',
					items: [
						{ label: 'Deployment & config', slug: 'operating/deployment' },
						{ label: 'Cookbook', slug: 'operating/cookbook' },
						{ label: 'Troubleshooting', slug: 'operating/troubleshooting' },
						{ label: 'Data safety', slug: 'operating/data-safety' },
					],
				},
				{
					label: 'Why CTXone',
					collapsed: true,
					items: [
						{ label: 'Vision', slug: 'why-ctxone/vision' },
						{ label: 'Context anxiety', slug: 'why-ctxone/context-anxiety' },
						{ label: 'Token economics', slug: 'why-ctxone/token-economics' },
						{ label: 'Use cases', slug: 'why-ctxone/use-cases' },
						{ label: 'Cost savings', slug: 'why-ctxone/cost-savings' },
					],
				},
			],
			// Don't generate a 404 page under /404 — Astro's own 404.astro
			// (if we add one) takes precedence. Default is fine.
			favicon: '/favicon.svg',
			head: [
				// Social card for when ctxone.com gets shared on Twitter/X, Slack, etc.
				{
					tag: 'meta',
					attrs: {
						property: 'og:image',
						content: 'https://ctxone.com/og-image.png',
					},
				},
				{
					tag: 'meta',
					attrs: {
						name: 'twitter:card',
						content: 'summary_large_image',
					},
				},
			],
		}),
	],
});

