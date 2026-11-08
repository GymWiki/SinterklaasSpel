import type { TaskTpl } from './round1';

/**
 * Ronde 2: De Uitpak- & Kijkronde (geen tijdslimiet) — duurt tot elk cadeau in de kamer is uitgepakt.
 * Tokens: {A} actieve speler, {L} links, {R} rechts, {O} tegenover, {X} willekeurige andere speler.
 */
export const R2_UNWRAP: TaskTpl[] = [
  {
    t: '{A}, pak één van je eigen nog ingepakte cadeaus uit!',
    sub: 'Zijn al jouw eigen cadeaus al open? Kies dan een ingepakt cadeau bij iemand anders, pak het uit, en kies of je het ruilt met één van je eigen cadeaus!',
    tags: ['a'],
  },
  {
    t: '{A}, scheur het papier van een van je eigen ingepakte cadeaus!',
    sub: 'Zijn al jouw eigen cadeaus al open? Kies dan een ingepakt cadeau bij iemand anders, pak het uit, en kies of je het ruilt met één van je eigen cadeaus!',
    tags: ['a'],
  },
  {
    t: '{A}, kies een van je eigen ingepakte cadeaus, schud eraan en raad hardop wat erin zit. Pak het daarna uit!',
    sub: 'Zijn al jouw eigen cadeaus al open? Kies dan een ingepakt cadeau bij iemand anders, pak het uit, en kies of je het ruilt met één van je eigen cadeaus!',
    tags: ['k', 'm'],
  },
];

export const R2_NEIGHBOR: TaskTpl[] = [
  { t: '{A}, ruil een cadeau (ingepakt of uitgepakt) met {L} (links van je)!', sub: 'Jij kiest wat je weggeeft, je buurman kiest wat je terugkrijgt!', tags: ['a'], focus: 'L' },
  { t: '{A}, ruil een cadeau (ingepakt of uitgepakt) met {R} (rechts van je)!', sub: 'Jij kiest wat je weggeeft, je buurman kiest wat je terugkrijgt!', tags: ['a'], focus: 'R' },
];

export const R2_OPPOSITE: TaskTpl[] = [
  { t: '{A} en {O} (tegenover elkaar): wijs op 3 allebei tegelijk een cadeau van de ander aan en ruil ze direct om!', tags: ['a'], focus: 'O' },
  { t: '{A} en {O}, kijk elkaar aan! Op 3 wijzen jullie allebei tegelijk een cadeau van de ander aan, en dan wisselen!', tags: ['a'], focus: 'O' },
];

export const R2_BALANCE: TaskTpl[] = [
  {
    t: '{A}, pak één cadeau weg bij degene in de kamer die op dit moment de MEESTE cadeaus voor zich heeft liggen!',
    sub: 'Ben jij dat zelf? Dan geef je juist één cadeau aan degene met de minste cadeaus.',
    tags: ['a'],
  },
];

/** Gooi 4 in Ronde 2: 10 seconden duel. Winnaar steelt een cadeau van de ander én pakt het direct uit. */
export const R2_DUEL_SUB = 'De winnaar mag een cadeau van de ander stelen én het direct uitpakken!';
