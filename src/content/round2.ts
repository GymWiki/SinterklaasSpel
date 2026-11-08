import type { TaskTpl } from './round1';

export const R2_STEAL: TaskTpl[] = [
  { t: '{A}, steel een cadeau van {L} (links van je)!', tags: ['a'], focus: 'L' },
  { t: '{A}, steel een cadeau van {R} (rechts van je)!', tags: ['a'], focus: 'R' },
  { t: '{A}, steel een cadeau van {O} (tegenover je)!', tags: ['a'], focus: 'O' },
  { t: '{A}, steel een cadeau van {X}! Jij mag kiezen welk.', tags: ['a'], focus: 'X' },
  { t: '{A}, pak het mooiste cadeau van {L} (links van je) af!', tags: ['a'], focus: 'L' },
  { t: '{A}, sluip naar {O} (tegenover je) en neem een cadeau mee. Piet kijkt de andere kant op!', tags: ['k', 'm'], focus: 'O' },
  { t: '{A}, steel een cadeau van {X} en zeg erbij: "Sorry, niet sorry!"', tags: ['m', 'v'], focus: 'X' },
  { t: '{A}, steel met een sluwe grijns een cadeau van {R} (rechts van je). Wie het eerst lacht, verliest!', tags: ['m', 'v'], focus: 'R' },
];

export const R2_SWAP: TaskTpl[] = [
  { t: '{A}, ruil een cadeau met {L} (links van je)! Jij kiest welke.', tags: ['a'], focus: 'L' },
  { t: '{A}, ruil een cadeau met {R} (rechts van je)! Jij kiest welke.', tags: ['a'], focus: 'R' },
  { t: '{A}, ruil een cadeau met {O} (tegenover je)! Jij kiest welke.', tags: ['a'], focus: 'O' },
  { t: '{A}, ruil een cadeau met {X}! De ander mag niet weigeren.', tags: ['a'], focus: 'X' },
  { t: '{A}, ruil je minst favoriete cadeau met het mooiste cadeau van {O} (tegenover je). Veel succes met overtuigen!', tags: ['m', 'v'], focus: 'O' },
  { t: '{A}, ruil een cadeau met {L} (links van je). Maak er een nette handdruk van!', tags: ['k', 'm'], focus: 'L' },
];

export const R2_SHIFT: TaskTpl[] = [
  { t: 'GROEPS-SCHUIF! Iedereen geeft zijn of haar cadeau door {DIR}!', tags: ['a'] },
  { t: 'Alle cadeaus schuiven één plek op, {DIR}! Houd je vast, {A} heeft gegooid!', tags: ['a'] },
  { t: 'Iedereen pakt zijn cadeau en geeft het door {DIR}. Niet gluren!', tags: ['k', 'm'] },
  { t: 'Carrousel! Alle cadeaus gaan één stoel verder, {DIR}. Zeg er "Pakjesavond!" bij!', tags: ['m', 'v'] },
];

export const R2_VAULT: string[] = [
  '{A} wint een SLOTJE 🔒! Zet 1 cadeau veilig — dat mag alleen als je nog minstens één ander cadeau overhoudt om mee te spelen.',
  '🔒 De Kluis gaat open voor {A}! Kies 1 cadeau om veilig te stellen, maar hou minstens één ander cadeau over om mee te spelen.',
];
export const R2_MIJTER: string[] = [
  '{A} krijgt de MIJTER 🛡️! Je hoeft niet mee te doen bij verplichte groeps-wissels — totdat iemand anders de Mijter gooit.',
  '🛡️ De Mijter van Sinterklaas is voor {A}! Bij groeps-wissels blijf jij rustig zitten.',
];
export const R2_REVERSE: string[] = [
  '🔄 Richting omdraaien! De beurten gaan voortaan {DIR}.',
  '🔄 Plotselinge keer! Vanaf nu gaat het spel {DIR}.',
];
export const R2_CHAIRS: string[] = [
  '💺 STOELENDANS! {P} en {Q} wisselen fysiek van stoel. Hun cadeaus blijven liggen waar ze lagen!',
  '💺 Wissel! {P} en {Q} wisselen van plek in de woonkamer, de cadeaus blijven op hun plaats!',
];
