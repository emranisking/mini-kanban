export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

const COLUMN_ACCENTS = ['blue', 'amber', 'violet', 'green', 'rose', 'teal'] as const;
export type ColumnAccent = (typeof COLUMN_ACCENTS)[number];

export function accentForIndex(index: number): ColumnAccent {
  return COLUMN_ACCENTS[index % COLUMN_ACCENTS.length];
}

export function initials(name?: string | null): string {
  if (!name) return '';

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

/** Deterministic hue for a user's avatar so the same person always gets the same color. */
export function avatarHue(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}
