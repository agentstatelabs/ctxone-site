/**
 * Accent color per Why-CTXone topic. Single source of truth so the
 * index cards and the detail-page heroes agree — click a green card,
 * land on a green-shaded page.
 */
export type Accent = 'blue' | 'green' | 'amber';

const map: Record<string, Accent> = {
	vision: 'blue',
	'context-anxiety': 'green',
	'token-economics': 'amber',
	'cost-savings': 'blue',
};

export function accentFor(id: string): Accent {
	return map[id] ?? 'blue';
}
