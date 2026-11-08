import type { Tag } from './tags';

/**
 * Tokens: {A} actieve speler, {L} links, {R} rechts, {O} tegenover, {X} willekeurige andere speler.
 * (links/rechts zijn gezien vanuit de actieve speler, met zijn gezicht naar het midden.)
 */
export interface TaskTpl {
  t: string;
  tags: Tag[];
  timer?: number;
  sub?: string;
  focus?: 'L' | 'R' | 'O' | 'X';
}

/** Ronde 1 ("Verdeelronde"): exact deze 6 vaste uitkomsten, 1 per gegooid aantal ogen. */
export const R1_FIXED: Record<number, { title: string; emoji: string; kind: 'unwrap' | 'shift' | 'steal' | 'give' | 'party'; main: string; sub?: string; arrow?: 'cw' | 'ccw' }> = {
  1: { title: 'PAK EEN CADEAU', emoji: '🎁', kind: 'unwrap', main: '{A}, je mag een cadeautje van de stapel pakken! Let op: pak het cadeautje NOG NIET uit.' },
  2: { title: 'ALLEMAAL NAAR LINKS', emoji: '⬅️', kind: 'shift', arrow: 'cw', main: 'Iedereen geeft nu één cadeau aan de persoon LINKS van zich!' },
  3: { title: 'PAK WEG BIJ IEMAND', emoji: '🦹', kind: 'steal', main: '{A}, je mag een cadeau naar keuze wegpakken bij iemand anders!', sub: 'Heeft nog niemand een cadeau? Pak er dan één van de stapel zonder uit te pakken.' },
  4: { title: 'ALLEMAAL NAAR RECHTS', emoji: '➡️', kind: 'shift', arrow: 'ccw', main: 'Iedereen geeft nu één cadeau aan de persoon RECHTS van zich!' },
  5: { title: 'GEEF AAN DE MINSTE', emoji: '🤲', kind: 'give', main: '{A}, geef een cadeau van jezelf aan de persoon met de minste cadeaus.', sub: 'Heb je zelf geen cadeaus? Dan gaat de beurt voorbij.' },
  6: { title: 'FEEST!', emoji: '🥳', kind: 'party', main: 'FEEST! {A}, je mag een cadeautje van de stapel pakken én het meteen uitpakken!' },
};
