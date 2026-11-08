import type { TaskTpl } from './round1';

export const R3_STEAL: TaskTpl[] = [
  { t: '{A}, steel een cadeau van {L} (links van je)!', tags: ['a'], focus: 'L' },
  { t: '{A}, steel een cadeau van {R} (rechts van je)!', tags: ['a'], focus: 'R' },
  { t: '{A}, steel een cadeau van {O} (tegenover je)!', tags: ['a'], focus: 'O' },
  { t: '{A}, steel een cadeau van {X}! Jij mag kiezen welk.', tags: ['a'], focus: 'X' },
  { t: '{A}, pak het mooiste cadeau van {L} (links van je) af!', tags: ['a'], focus: 'L' },
  { t: '{A}, sluip naar {O} (tegenover je) en neem een cadeau mee. Piet kijkt de andere kant op!', tags: ['k', 'm'], focus: 'O' },
  { t: '{A}, steel een cadeau van {X} en zeg erbij: "Sorry, niet sorry!"', tags: ['m', 'v'], focus: 'X' },
  { t: '{A}, steel met een sluwe grijns een cadeau van {R} (rechts van je). Wie het eerst lacht, verliest!', tags: ['m', 'v'], focus: 'R' },
];

export const R3_SWAP: TaskTpl[] = [
  { t: '{A}, ruil een cadeau met {L} (links van je)! Jij kiest welke.', tags: ['a'], focus: 'L' },
  { t: '{A}, ruil een cadeau met {R} (rechts van je)! Jij kiest welke.', tags: ['a'], focus: 'R' },
  { t: '{A}, ruil een cadeau met {O} (tegenover je)! Jij kiest welke.', tags: ['a'], focus: 'O' },
  { t: '{A}, ruil een cadeau met {X}! De ander mag niet weigeren.', tags: ['a'], focus: 'X' },
  { t: '{A}, ruil je minst favoriete cadeau met het mooiste cadeau van {O} (tegenover je). Veel succes met overtuigen!', tags: ['m', 'v'], focus: 'O' },
  { t: '{A}, ruil een cadeau met {L} (links van je). Maak er een nette handdruk van!', tags: ['k', 'm'], focus: 'L' },
];

export const R3_SHIFT: TaskTpl[] = [
  { t: 'GROEPS-SCHUIF! Iedereen geeft zijn of haar cadeau door {DIR}!', tags: ['a'] },
  { t: 'Alle cadeaus schuiven één plek op, {DIR}! Houd je vast, {A} heeft gegooid!', tags: ['a'] },
  { t: 'Iedereen pakt zijn cadeau en geeft het door {DIR}. Niet gluren!', tags: ['k', 'm'] },
  { t: 'Carrousel! Alle cadeaus gaan één stoel verder, {DIR}. Zeg er "Pakjesavond!" bij!', tags: ['m', 'v'] },
];

export const R3_VAULT: string[] = [
  '{A} wint een SLOTJE 🔒! Zet 1 cadeau veilig — dat mag alleen als je nog minstens één ander cadeau overhoudt om mee te spelen.',
  '🔒 De Kluis gaat open voor {A}! Kies 1 cadeau om veilig te stellen, maar hou minstens één ander cadeau over om mee te spelen.',
];
export const R3_MIJTER: string[] = [
  '{A} krijgt de MIJTER 🛡️! Je bent immuun: je hoeft niet mee te doen bij groeps-schuiven en niemand mag van jou stelen. Totdat iemand anders de Mijter gooit.',
  '🛡️ De Mijter van Sinterklaas is voor {A}! Bij groeps-schuiven blijf jij zitten en je cadeaus zijn veilig voor stelers.',
];
export const R3_REVERSE: string[] = [
  '🔄 Richting omdraaien! De beurten gaan voortaan {DIR}. {A}, ruil een cadeau met {N}, die nu na jou aan de beurt is!',
  '🔄 Plotselinge keer! Vanaf nu gaat het spel {DIR}. {A}, ruil een cadeau met {N}, de volgende in de nieuwe richting!',
];
export const R3_CHAIRS: string[] = [
  '⚡ CHAOS VAN PIET! 💺 {P} en {Q} moeten fysiek van stoel wisselen. Hun volledige stapel cadeaus blijft liggen waar ze lag!',
  '⚡ CHAOS VAN PIET! 💺 STOELENDANS: {P} en {Q} wisselen van plek in de woonkamer, de cadeaus blijven op hun plaats!',
];

/** Worp 6 in Ronde 2 (zonder Grote Boek): Chaos / Bonus. */
export const R3_DOUBLE: string[] = [
  '💥 DUBBELE RUIL! {A}, ruil een cadeau met {L} (links van je) én daarna een cadeau met {O} (tegenover je)!',
  '💥 DUBBELE RUIL! {A}, ruil een cadeau met {R} (rechts van je) én daarna een cadeau met {X}!',
  '💥 DUBBELE RUIL! {A}, ruil een cadeau met {O} (tegenover je) én daarna met {L} (links van je)!',
];
export const R3_BIGCHAIRS: string[] = [
  '💥 CHAOS! {P} ↔ {Q} en {U} ↔ {V} wisselen tegelijk van stoel! Alle cadeaus blijven liggen waar ze lagen!',
  '💥 STOELENDANS-CHAOS! {P} en {Q} wisselen van plek, en tegelijk ook {U} en {V}! De cadeaus blijven op hun plaats!',
];
export const R3_BONUS: string[] = [
  '🎰 BONUS-BEURT! {A}, steel een cadeau van {O} (tegenover je) en gooi daarna meteen nóg een keer!',
  '🎰 BONUS-BEURT! {A}, ruil een cadeau met {L} (links van je) en gooi daarna meteen nóg een keer!',
  '🎰 BONUS-BEURT! {A}, steel een cadeau van {X} en gooi daarna meteen nóg een keer!',
];

/** Extra steel/ruil-varianten voor Ronde 3 (gooi 1). */
R3_STEAL.push(
  { t: '{A}, steel het GROOTSTE cadeau van {X}!', tags: ['a'], focus: 'X' },
  { t: '{A}, steel het grootste cadeau van {R} (rechts van je)!', tags: ['a'], focus: 'R' },
  { t: '{A}, steel het kleinste cadeau van {L} (links van je) en doe alsof het per ongeluk was!', tags: ['k', 'm'], focus: 'L' },
);
R3_SWAP.push(
  { t: '{A}, ruil je SLECHTSTE cadeau voor het BESTE van {O} (tegenover je)!', tags: ['a'], focus: 'O' },
  { t: '{A}, ruil je slechtste cadeau voor het beste van {X}. Veel succes met overtuigen!', tags: ['a'], focus: 'X' },
);
R3_SHIFT.push(
  { t: 'GROEPS-SCHUIF! Iedereen geeft zijn of haar KLEINSTE cadeau één plek door, {DIR}!', tags: ['a'] },
  { t: 'GROEPS-SCHUIF! Iedereen geeft zijn of haar GROOTSTE cadeau één plek door, {DIR}!', tags: ['a'] },
  { t: 'GROEPS-SCHUIF! Iedereen geeft een cadeau naar keuze één plek door, {DIR}!', tags: ['a'] },
);

export const R3_DUEL_SUB = 'De winnaar steelt een cadeau van de verliezer!';

/** 10-seconden duels. {A} tegen {X}. */
export const R_DUELS: TaskTpl[] = [
  { t: '{A} vs {X}: Steen-Papier-Schaar! Op 3 tegelijk, bij gelijkspel direct opnieuw!', tags: ['a'], timer: 10 },
  { t: '{A} vs {X}: wie raakt het eerst iets ROODS aan?', tags: ['a'], timer: 10 },
  { t: '{A} vs {X}: staarwedstrijd! Wie knippert het eerst met de ogen?', tags: ['a'], timer: 10 },
  { t: '{A} vs {X}: noem om de beurt iets wat in een pakjeszak zit. Wie niets meer weet, verliest!', tags: ['a'], timer: 10 },
  { t: '{A} vs {X}: duimworstelen! Wie de duim van de ander 3 tellen vastpint, wint!', tags: ['a'], timer: 10 },
  { t: '{A} vs {X}: noem om de beurt een Sinterklaasliedje. Wie niets meer weet, verliest!', tags: ['k', 'm'], timer: 10 },
  { t: '{A} vs {X}: wie kan het langst op één been blijven staan?', tags: ['k'], timer: 10 },
  { t: '{A} vs {X}: wie maakt het gekste dierengeluid? De groep beslist!', tags: ['k', 'm'], timer: 10 },
  { t: '{A} vs {X}: noem om de beurt een bekende Nederlander. Wie niets meer weet, verliest!', tags: ['m', 'v'], timer: 10 },
  { t: '{A} vs {X}: wie eet als eerste een pepernoot op zonder handen te gebruiken?', tags: ['m', 'v'], timer: 10 },
  { t: '{A} vs {X}: noem om de beurt een film met een kerstboom erin. Wie niets meer weet, verliest!', tags: ['m', 'v'], timer: 10 },
  { t: '{A} vs {X}: wie vertelt in 10 seconden de gênantste anekdote? De groep kiest de winnaar!', tags: ['v'], timer: 10 },
];
