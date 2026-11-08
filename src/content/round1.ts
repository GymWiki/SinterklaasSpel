import type { Tag } from './tags';

/**
 * Tokens: {A} actieve speler, {L} links, {R} rechts, {O} tegenover, {X} willekeurige andere speler.
 * (links/rechts zijn gezien vanuit de actieve speler, met zijn gezicht naar het midden.)
 */
export interface TaskTpl {
  t: string;
  tags: Tag[];
  timer?: number; // seconden (zichtbare + hoorbare aftelklok)
  sub?: string;
  focus?: 'L' | 'R' | 'O' | 'X';
}

export const R1_FALLBACK = 'Nog geen uitgepakt cadeau om te ruilen? Pak dan een nieuw cadeau van de stapel!';
export const R1_MINI_SUB = 'Gelukt binnen de tijd? Pak een nieuw cadeau! Niet gelukt? Helaas, geen cadeau deze beurt.';

export type R1Kind = 'unwrap' | 'neighbor' | 'opposite' | 'mini' | 'bonus' | 'party';

export const R1_META: Record<R1Kind, { title: string; emoji: string }> = {
  unwrap: { title: 'UITPAKKEN!', emoji: '🎁' },
  neighbor: { title: 'BUREN-RUIL', emoji: '🔄' },
  opposite: { title: 'OVERKANT-ACTIE', emoji: '↔️' },
  mini: { title: 'MINI-OPDRACHT', emoji: '⏱️' },
  bonus: { title: 'EXTRA CADEAU', emoji: '🎀' },
  party: { title: 'PIETENFEEST', emoji: '🥳' },
};

/** Dobbelsteen -> categorie in Ronde 1 */
export const R1_DIE: Record<number, R1Kind> = { 1: 'unwrap', 2: 'neighbor', 3: 'opposite', 4: 'mini', 5: 'bonus', 6: 'party' };

export const R1: Record<R1Kind, TaskTpl[]> = {
  unwrap: [
    { t: '{A}, pak een nieuw cadeau van de stapel en scheur het papier eraf!', tags: ['a'] },
    { t: '{A}, kies een cadeau van de stapel en pak het uit. Iedereen kijkt mee!', tags: ['a'] },
    { t: '{A}, schud een cadeau van de stapel, raad hardop wat erin zit en pak het dan uit!', tags: ['a'] },
    { t: '{A}, pak een nieuw cadeau van de stapel en zeg met een Sinterklaasstem: "Dank u, Sint!"', tags: ['a'] },
    { t: '{A}, pak een nieuw cadeau uit met je ogen dicht. Voelen mag, gluren niet!', tags: ['k', 'm'] },
    { t: '{A}, pak een cadeau van de stapel en scheur het papier er in één keer af!', tags: ['k'] },
    { t: '{A}, pak een nieuw cadeau en lees het kaartje of de verpakking hardop voor aan iedereen.', tags: ['m'] },
    { t: '{A}, pak een nieuw cadeau uit en geef het cadeau meteen een eerlijk cijfer van 1 tot 10.', tags: ['m', 'v'] },
    { t: '{A}, pak een nieuw cadeau. Is het een misser? Dan mag je 10 seconden dramatisch klagen.', tags: ['v'] },
  ],
  neighbor: [
    { t: '{A}, ruil één van je uitgepakte cadeaus met {L} (links van je)!', tags: ['a'], focus: 'L' },
    { t: '{A}, ruil één van je uitgepakte cadeaus met {R} (rechts van je)!', tags: ['a'], focus: 'R' },
    { t: '{A}, kies: ruil een uitgepakt cadeau met {L} (links) óf met {R} (rechts)!', tags: ['a'], focus: 'L' },
    { t: '{A}, kijk {L} (links van je) vriendelijk aan en ruil een uitgepakt cadeau!', tags: ['k', 'm'], focus: 'L' },
    { t: '{A}, {R} (rechts van je) mag kiezen welk uitgepakt cadeau van jou wordt geruild. Jij mag het cadeau van {R} kiezen!', tags: ['m', 'v'], focus: 'R' },
    { t: '{A}, ruil een uitgepakt cadeau met {L} (links van je) en doe alsof je er heel blij mee bent!', tags: ['m', 'v'], focus: 'L' },
    { t: '{A}, ruil een uitgepakt cadeau met {R} (rechts van je). Onderhandelen mag, ruziemaken niet!', tags: ['k', 'm'], focus: 'R' },
  ],
  opposite: [
    { t: '{A}, geef je grootste cadeau aan {O} (tegenover je) en pak zelf een nieuw cadeau van de stapel.', tags: ['a'], focus: 'O' },
    { t: '{A}, ruil een uitgepakt cadeau met {O} (tegenover je)!', tags: ['a'], focus: 'O' },
    { t: '{A}, geef je kleinste cadeau aan {O} (tegenover je) en pak een nieuw cadeau van de stapel.', tags: ['a'], focus: 'O' },
    { t: '{A}, zwaai naar {O} (tegenover je) en ruil één van je cadeaus met {O}!', tags: ['k', 'm'], focus: 'O' },
    { t: '{A}, kijk {O} (tegenover je) strak aan en ruil één van je cadeaus. Wie het eerst lacht, moet het slechtste cadeau houden!', tags: ['m', 'v'], focus: 'O' },
  ],
  mini: [
    { t: '{A}, noem binnen 10 seconden 3 soorten strooigoed om een cadeau te mogen pakken!', tags: ['a'], timer: 10 },
    { t: '{A}, noem binnen 10 seconden 3 Sinterklaasliedjes!', tags: ['a'], timer: 10 },
    { t: '{A}, noem binnen 10 seconden 4 dingen die in een pakjeszak kunnen zitten!', tags: ['a'], timer: 10 },
    { t: '{A}, noem binnen 10 seconden 3 woorden die rijmen op "kind"!', tags: ['a'], timer: 10 },
    { t: '{A}, noem binnen 15 seconden 4 dingen die Sinterklaas bij zich heeft!', tags: ['a'], timer: 15 },
    { t: '{A}, zing binnen 15 seconden een regel van een Sinterklaasliedje. De groep beslist of het telt!', tags: ['a'], timer: 15 },
    { t: '{A}, noem binnen 10 seconden 3 Pietennamen of Sinterklaas-personages!', tags: ['k', 'm'], timer: 10 },
    { t: '{A}, doe binnen 10 seconden 5 keer "hoppa" op één been!', tags: ['k'], timer: 10 },
    { t: '{A}, maak binnen 10 seconden het geluid van een paard dat over een dak loopt!', tags: ['k'], timer: 10 },
    { t: '{A}, noem binnen 15 seconden 3 cadeaus die je ooit kreeg en meteen weggaf!', tags: ['m', 'v'], timer: 15 },
    { t: '{A}, noem binnen 10 seconden 3 dingen die je dit jaar kocht en nooit gebruikte!', tags: ['m', 'v'], timer: 10 },
    { t: '{A}, vertel binnen 15 seconden over het slechtste cadeau dat je ooit kreeg!', tags: ['m', 'v'], timer: 15 },
    { t: '{A}, noem binnen 10 seconden 3 ex-collega\'s of oud-klasgenoten bij naam en achternaam!', tags: ['v'], timer: 10 },
    { t: '{A}, noem binnen 10 seconden 3 dingen waar je dit jaar stiekem om moest huilen!', tags: ['v'], timer: 10 },
  ],
  bonus: [
    { t: '{A}, pak een nieuw cadeau én laat {X} ook een nieuw cadeau van de stapel pakken!', tags: ['a'] },
    { t: '{A}, pak een nieuw cadeau en kies iemand die ook mag uitpakken. Wie wordt het?', tags: ['a'] },
    { t: '{A}, pak een nieuw cadeau en laat {X} raden wat erin zit voordat je het openmaakt!', tags: ['a'] },
    { t: '{A}, pak een nieuw cadeau en geef een compliment aan {L} (links van je).', tags: ['k', 'm'] },
    { t: '{A}, pak een nieuw cadeau en vertel waarom {X} dit jaar op de "nette lijst" staat.', tags: ['k', 'm'] },
    { t: '{A}, pak een nieuw cadeau en vertel waarom {X} dit jaar eigenlijk op de "stoute lijst" hoort!', tags: ['m', 'v'] },
  ],
  party: [
    { t: '🎶 Pietendans! Iedereen staat op en danst 10 seconden. Daarna pakt {A} een nieuw cadeau.', tags: ['a'], timer: 10 },
    { t: '📣 Iedereen roept zo hard mogelijk "HO HO HO!" en {A} pakt daarna een nieuw cadeau.', tags: ['k', 'm'] },
    { t: '👏 Applaus voor {A}! Iedereen klapt en {A} pakt een nieuw cadeau.', tags: ['a'] },
    { t: '🎅 Doe een Sinterklaas-imitatie, {A}! De groep geeft een cijfer en je pakt een nieuw cadeau.', tags: ['m', 'v'] },
    { t: '🥂 Proost! Iedereen neemt een slok of een pepernoot. Daarna pakt {A} een nieuw cadeau.', tags: ['m', 'v'] },
    { t: '🕺 Iedereen doet 10 seconden de lopende-band-dans, ook {A}. Daarna: een nieuw cadeau pakken!', tags: ['k'], timer: 10 },
  ],
};
