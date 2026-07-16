import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

/**
 * Content collections for the CTXone site.
 *
 * - `docs` — Starlight docs, populated by scripts/import-docs.mjs
 *   from the markdown at the repo root. The src/content/docs/
 *   tree is gitignored; source of truth is ../*.md.
 * - `blog` — blog posts authored directly in src/content/blog/*.md
 *   (or .mdx). Tracked in git. `draft: true` hides a post from
 *   the public index and its dynamic route.
 */

const blog = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		author: z.string().default('CTXone team'),
		draft: z.boolean().default(false),
		tags: z.array(z.string()).optional(),
	}),
});

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
	blog,
};
