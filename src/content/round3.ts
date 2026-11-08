/**
 * Ronde 3: De Stoomboot-Finale. Vaste categorie per getal; gooi 4 = Opdrachten-Deck, gooi 6 = Chaos van Piet.
 * Tokens: {A} actieve speler, {L} links, {R} rechts, {O} overkant, {X} tegenstander.
 */
export const R3_FOOT = '🔒 Cadeaus in de Kluis zijn veilig! 🛡️ De Mijter is immuun!';

/** Gooi 1: gewoon stelen. Meestal de simpele variant, af en toe subtiel anders (deck, dus geen directe herhaling). */
export const R3_STEAL: string[] = [
  '{A}, je mag één uitgepakt cadeau naar keuze wegpakken bij iemand anders in de kamer!',
  '{A}, je mag één uitgepakt cadeau naar keuze wegpakken bij iemand anders in de kamer!',
  '{A}, je mag één uitgepakt cadeau naar keuze wegpakken bij {L} of {R}!',
  '{A}, je mag één uitgepakt cadeau naar keuze wegpakken bij iemand anders in de kamer!',
  '{A}, je mag één uitgepakt cadeau naar keuze wegpakken bij {O} (recht tegenover je)!',
  '{A}, je mag één uitgepakt cadeau naar keuze wegpakken bij iemand anders in de kamer!',
];

/** Gooi 2: groeps-schuif. {DIR} = met de klok mee / tegen de klok in. Alleen het type cadeau wisselt. */
export const R3_SHIFT: string[] = [
  'GROEPS-SCHUIF! Iedereen geeft zijn of haar KLEINSTE cadeau één plek door, {DIR}!',
  'GROEPS-SCHUIF! Iedereen geeft zijn of haar GROOTSTE cadeau één plek door, {DIR}!',
  'GROEPS-SCHUIF! Iedereen geeft één cadeau naar EIGEN KEUZE één plek door, {DIR}!',
];
export const R3_SHIFT_SUB = '(Wie 0 cadeaus heeft, geeft niets weg maar ontvangt wel.)';

export const R3_VAULT: string[] = [
  '{A} wint een GOUDEN SLOTJE 🔒! Leg 1 cadeau veilig achter de bank, maar alleen als je nog minstens één ander cadeau overhoudt om mee te spelen.',
];
export const R3_MIJTER: string[] = [
  '{A} wint DE MIJTER 🛡️! Je bent immuun bij groeps-schuiven en stelen, totdat iemand anders de Mijter gooit.',
];

/** Gooi 5: richting omdraaien + buren-wissel. */
export const R3_REVERSE: string[] = [
  '🔄 Richting omdraaien! De beurten gaan voortaan {DIR}. {A}, ruil één cadeau met een directe buurman: {L} of {R}!',
];

/** Gooi 6: Chaos-Deck van 6 kaarten. */
export type ChaosEffect = 'SWAP_SEATS_TARGET' | 'SWAP_SEATS_OPPOSITE' | 'NONE' | 'CLEAR_VAULTS' | 'CLAIM_MITRE';
export const CHAOS: { t: string; effect: ChaosEffect; title: string }[] = [
  { effect: 'SWAP_SEATS_TARGET', title: 'STOELENDANS', t: 'STOELENDANS! {A} en {X} wisselen NU rustig van zitplek in de woonkamer, maar ALLE cadeaus blijven liggen waar ze liggen! Jullie nemen elkaars hele buit over!' },
  { effect: 'SWAP_SEATS_OPPOSITE', title: 'DE OVERSTEEK', t: 'DE OVERSTEEK! {A} en {O} wisselen NU fysiek van zitplek in de woonkamer! Laat alle cadeaus liggen: jullie spelen verder met de stapel van de ander!' },
  { effect: 'NONE', title: 'TOTALE BUIT-WISSEL', t: 'TOTALE BUIT-WISSEL! Iedereen blijft lekker zitten, maar {A} en {X} moeten hun VOLLEDIGE stapel cadeaus (behalve de Kluis 🔒) met elkaar omruilen!' },
  { effect: 'CLEAR_VAULTS', title: 'INBRAAK VAN PIET', t: 'INBRAAK VAN PIET! Alle Gouden Slotjes (🔒 De Kluis) in de kamer springen NU open! Elk veiliggesteld cadeau moet terug naar de gewone stapel, én {A} mag direct 1 cadeau naar keuze stelen!' },
  { effect: 'NONE', title: 'REVOLUTIE', t: 'REVOLUTIE! Wie heeft er op dit moment de MEESTE cadeaus en wie heeft er de MINSTE? Deze twee spelers moeten nu hun volledige stapel cadeaus (exclusief Kluis 🔒) met elkaar omruilen!' },
  { effect: 'CLAIM_MITRE', title: 'JACKPOT', t: 'JACKPOT! {A} krijgt per direct 🛡️ De Mijter én mag nu meteen bij één speler naar keuze het mooiste cadeau wegpakken!' },
];
