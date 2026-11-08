export type Audience = 'kids' | 'mixed' | 'adults';
/** a = voor iedereen, k = kids, m = gemengd, v = vrienden 18+ */
export type Tag = 'a' | 'k' | 'm' | 'v';

export const AUDIENCES: { id: Audience; label: string; emoji: string; desc: string }[] = [
  { id: 'kids', label: 'Familie & Kids', emoji: '🧒', desc: 'Veilige, actieve opdrachten' },
  { id: 'mixed', label: 'Gezellig Gemengd', emoji: '🎄', desc: 'Voor jong en oud' },
  { id: 'adults', label: 'Vriendengroep 18+', emoji: '🍻', desc: 'Scherpere humor en bluf' },
];

const MAP: Record<Audience, Tag[]> = {
  kids: ['a', 'k'],
  mixed: ['a', 'k', 'm'],
  adults: ['a', 'm', 'v'],
};

export function forAudience<T extends { tags: Tag[] }>(items: T[], audience: Audience): T[] {
  const ok = MAP[audience];
  const r = items.filter((i) => i.tags.some((t) => ok.includes(t)));
  return r.length ? r : items;
}
