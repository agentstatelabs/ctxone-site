import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * All listable blog posts (non-draft), newest first.
 *
 * Date gating is intentionally NOT done here. Because the site is
 * statically built, a build-time date filter would require a rebuild
 * every time a post's pubDate arrives. Instead we ship every non-draft
 * post and let the browser decide what's visible at page-load time
 * (see the inline scripts in blog/index.astro and blog/[slug].astro).
 * That gives a true weekly drip with zero scheduled rebuilds: a
 * future-dated post is present but hidden until its date passes.
 *
 * `draft: true` still hides a post completely — it is never shipped.
 */
export async function getListablePosts(): Promise<CollectionEntry<'blog'>[]> {
	const posts = await getCollection('blog', ({ data }) => !data.draft);
	return posts.sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
	);
}
