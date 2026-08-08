/**
 * Accent color per use case. Single source of truth so the /use-cases
 * index cards and each use-case detail page agree on color.
 */
export type Accent = 'blue' | 'green' | 'amber';

const map: Record<string, Accent> = {
	'ai-coding': 'blue',
	'team-shared-context': 'green',
	'large-codebase': 'amber',
	'long-running-projects': 'amber',
	'regulated-teams': 'blue',
	'self-hosted-chat': 'green',
};

/** Resolve by slug (the /use-cases/<slug> segment). */
export function useCaseAccent(slug: string): Accent {
	return map[slug] ?? 'blue';
}
