/**
 * Ronde 2: De Uitpakronde (geen tijdslimiet). Vaste, rustige betekenis per getal; alleen gooi 4 trekt een kaart uit het Opdrachten-Deck.
 * Tokens: {A} actieve speler, {L} links, {R} rechts, {O} overkant.
 */
export interface FixedTask {
  title: string;
  emoji: string;
  kind: 'unwrap' | 'neighbor' | 'opposite' | 'balance';
  main: string;
  sub?: string;
  /** welke buren/overkant meedoen (voor highlight op de zitkring) */
  with?: ('L' | 'R' | 'O')[];
}

const UNWRAP: FixedTask = {
  title: 'UITPAKKEN!', emoji: '🎁', kind: 'unwrap',
  main: '{A}, je mag één van je eigen nog ingepakte cadeaus uitpakken!',
  sub: '(Zijn al jouw eigen cadeaus al open? Pak dan een ingepakt cadeau bij iemand anders uit én ruil het als je wilt met één van je eigen cadeaus!)',
};

export const R2_FIXED: Record<number, FixedTask> = {
  1: UNWRAP,
  2: { title: 'BUREN-RUIL', emoji: '🔄', kind: 'neighbor', main: '{A}, ruil één cadeau (ingepakt of uitgepakt) met {L} of {R} naast je!', with: ['L', 'R'] },
  3: { title: 'OVERKANT-RUIL', emoji: '↔️', kind: 'opposite', main: '{A}, ruil één cadeau naar keuze met {O} (recht tegenover je)!', with: ['O'] },
  5: {
    title: 'PAK VAN DE RIJKSTE', emoji: '⚖️', kind: 'balance',
    main: '{A}, pak één cadeau weg bij degene die op dit moment de MEESTE cadeaus voor zich heeft liggen!',
    sub: '(Ben je dat zelf? Pak dan één van je eigen ingepakte cadeaus uit.)',
  },
  6: UNWRAP,
};
