/**
 * Het Woonkamer-Proof Opdrachten-Deck: 50 kaarten, alleen bij worp 4 in Ronde 2 & 3 (Smart Deck: geen herhaling).
 * Tokens: {A} speler, {X} tegenstander, {O} overkant, {L} links, {R} rechts.
 * sec > 0: de klok start NIET vanzelf; de host tikt "Start klok" en de TV telt eerst "Klaar? 3... 2... 1... GO!" af.
 */
export type DeckCat = 'groep' | 'duel' | 'klok' | 'pingpong' | 'bluf' | 'stem';
export interface DeckCard { cat: DeckCat; sec: number; t: string }

export const DECK_CATS: Record<DeckCat, { title: string; emoji: string }> = {
  groep: { title: 'HELE GROEP IN ACTIE', emoji: '👥' },
  duel: { title: '1-TEGEN-1 DUEL', emoji: '⚔️' },
  klok: { title: 'SOLO-UITDAGING', emoji: '⏱️' },
  pingpong: { title: 'PINGPONG-DUEL', emoji: '🏓' },
  bluf: { title: 'BLUF & RADEN', emoji: '🎭' },
  stem: { title: 'GROEPS-STEMMING', emoji: '🗳️' },
};

export const DECK: DeckCard[] = [
  // A: hele groep in actie (zittend)
  { cat: 'groep', sec: 0, t: 'IEDEREEN: De vloer is lava! Til NU allebei je voeten van de vloer! Wie dit als LAATSTE doet, moet een cadeau afstaan aan {A}!' },
  { cat: 'groep', sec: 15, t: 'IEDEREEN: Bevries NU als een standbeeld! 15 seconden lang niet bewegen of lachen. Wie volgens {A} als eerste beweegt, moet een cadeau aan {A} geven!' },
  { cat: 'groep', sec: 0, t: 'IEDEREEN: Maak NU met twee handen een puntdakje (mijter) boven je hoofd! Wie dit als LAATSTE doet, zit te slapen en moet een cadeau afstaan aan {A}!' },
  { cat: 'groep', sec: 0, t: 'OPLETTEN! Iedereen steekt NU zijn linkerhand hoog in de lucht! Wie als LAATSTE zijn hand omhoog heeft, moet een cadeau ruilen met {A}!' },
  { cat: 'groep', sec: 20, t: 'STILTE IN DE KAMER! Vanaf de gong mag niemand 20 seconden lang praten of lachen (gekke bekken trekken naar elkaar mag wel!). Wie als eerste geluid maakt, geeft een cadeau aan {A}!' },
  { cat: 'groep', sec: 0, t: 'IEDEREEN: Leg NU allebei je handen plat op je eigen hoofd! Wie dit als LAATSTE doet, laat zijn buit onbewaakt: {A} mag een cadeau bij diegene wegpakken!' },
  { cat: 'groep', sec: 0, t: 'IEDEREEN: Steek één voet naar voren! {A} is de jury en kiest wie de leukste of gekste sokken/schoenen aan heeft: jullie twee mogen een cadeau ruilen!' },
  { cat: 'groep', sec: 0, t: 'IEDEREEN: Kruis NU je armen over elkaar als een boze Piet! Wie dit als LAATSTE doet, moet een cadeau afstaan aan de persoon met de minste cadeaus!' },
  { cat: 'groep', sec: 0, t: 'IEDEREEN: Wijs zo snel mogelijk naar het plafond! Wie als LAATSTE omhoog wijst, moet zijn grootste cadeau wisselen met het kleinste cadeau van {A}!' },
  { cat: 'groep', sec: 0, t: 'IEDEREEN: Doe allebei je handen voor je ogen! Wie dit als LAATSTE doet, moet een cadeau naar keuze inleveren bij {A}!' },
  // B: 1-tegen-1 duels vanaf je zitplek
  { cat: 'duel', sec: 15, t: '{A} tegen {X}! Blijf zitten en raak als eerste iets ROODS aan (je eigen kleding, een cadeau of iets op tafel telt!). De snelste mag een cadeau bij de ander wegpakken!' },
  { cat: 'duel', sec: 0, t: '{A} tegen {O}! Doe vanaf je stoel nú één keer Steen-Papier-Schaar. De winnaar steelt een cadeau naar keuze van de verliezer!' },
  { cat: 'duel', sec: 20, t: '{A} tegen {X}! Maak een propje van een stukje inpakpapier en gooi het vanaf je eigen stoel zo dicht mogelijk bij het midden van het kleed/de tafel. De winnaar steelt een cadeau van de ander!' },
  { cat: 'duel', sec: 20, t: '{A} en {O} moeten elkaar 20 seconden strak in de ogen kijken zonder te lachen of te praten. Wie het eerst lacht, moet een cadeau aan de ander geven!' },
  { cat: 'duel', sec: 10, t: 'Buren-Reflex! {A} tegen {L} en {R}: wie tikt er met zijn eigen hand als eerste zijn eigen linkerschoen aan? De snelste mag bij één van de andere twee een cadeau stelen!' },
  { cat: 'duel', sec: 15, t: '{A} tegen {X}! Wie raakt er vanaf zijn plek als eerste iets van HOUT of METAAL aan? De winnaar steelt een cadeau van de ander!' },
  { cat: 'duel', sec: 15, t: '{A} tegen {L}! Leg allebei je handen plat bovenop je hoofd en ga op één voet (of zonder rugleuning) zitten. Wie binnen 15 seconden als eerste opgeeft, verliest een cadeau!' },
  { cat: 'duel', sec: 0, t: 'Duimen-Duel! {A} en {X} tellen tot 3 en steken allebei hun duim OMHOOG of OMLAAG. Doen jullie hetzelfde? Dan steelt {A} een cadeau! Verschillend? Dan ruilen jullie een cadeau!' },
  { cat: 'duel', sec: 15, t: '{A} tegen {R}: wie kan er het langst op één adem \'Siiiiinterklaasje\' zeggen zonder adem te halen? De winnaar pakt een cadeau van de verliezer!' },
  { cat: 'duel', sec: 15, t: '{A} en {X}: wie tikt er als eerste zijn neus, dan zijn oren, klapt 3 keer en steekt twee duimen omhoog? De snelste wint een cadeau van de ander!' },
  // C: solo uitdagingen
  { cat: 'klok', sec: 15, t: '{A}, noem binnen 15 seconden 4 verschillende soorten Sinterklaas-snoepgoed of lekkernijen! Gelukt = steel een cadeau van {X}. Mislukt = geef een cadeau aan {L}!' },
  { cat: 'klok', sec: 15, t: '{A}, noem binnen 15 seconden 4 woorden die rijmen op \'BOOT\' (of \'ROOD\')! Gelukt = steel een cadeau naar keuze. Mislukt = geef een cadeau aan {R}!' },
  { cat: 'klok', sec: 15, t: '{A}, noem binnen 15 seconden 4 dingen die je meeneemt naar het strand! Gelukt = steel een cadeau van {O}!' },
  { cat: 'klok', sec: 15, t: '{A}, noem binnen 15 seconden 5 dieren die in de dierentuin wonen! Gelukt = steel een cadeau naar keuze!' },
  { cat: 'klok', sec: 20, t: '{A}, zing of noem binnen 20 seconden een regel uit 2 verschillende Sinterklaasliedjes! Gelukt = pak een cadeau naar keuze bij {X}!' },
  { cat: 'klok', sec: 15, t: '{A}, noem binnen 15 seconden 4 dingen uit de keuken of badkamer die in een schoen passen! Gelukt = ruil één van je cadeaus met wie je maar wilt!' },
  { cat: 'klok', sec: 20, t: '{A}, noem binnen 20 seconden 3 dingen die zowel jij als {R} allebei heel lekker vinden! Gelukt? Dan mag je een cadeau stelen bij {X}!' },
  { cat: 'klok', sec: 20, t: '{A}, tel binnen 20 seconden foutloos hardop terug van 20 naar 10! Gelukt = steel een cadeau van {X}. Mislukt = geef een cadeau aan {L}!' },
  { cat: 'klok', sec: 15, t: '{A}, noem binnen 15 seconden 4 dingen die je kunt eten of drinken die beginnen met de letter P of B! Gelukt = steel een cadeau naar keuze!' },
  { cat: 'klok', sec: 15, t: '{A}, noem binnen 15 seconden 5 verschillende kleuren die je nu in de woonkamer ziet (en wijs ze aan)! Gelukt = pak een cadeau bij {O}!' },
  // D: pingpong duels
  { cat: 'pingpong', sec: 30, t: '{A} en {X} (30 sec): Noem om de beurt een DIER. Wie langer dan 3 seconden stilvalt of dubbel noemt, verliest een cadeau aan de ander!' },
  { cat: 'pingpong', sec: 30, t: '{A} en {O} (30 sec): Noem om de beurt een SUPERMARKT of WINKEL. Wie als eerste vastloopt, moet een cadeau afstaan aan de ander!' },
  { cat: 'pingpong', sec: 30, t: '{A} en {L} (30 sec): Noem om de beurt een SNACK, SNOEPJE of IJS-SMAAK. Wie vastloopt, moet een cadeau afstaan aan de ander!' },
  { cat: 'pingpong', sec: 30, t: '{A} en {R} (30 sec): Noem om de beurt een LAND in de wereld. Degene die vastloopt of dubbel noemt, verliest een cadeau aan de ander!' },
  { cat: 'pingpong', sec: 25, t: '{X} stelt 25 seconden lang vragen aan {A}. Als {A} \'Ja\', \'Nee\' of \'Eh\' zegt, wint {X} een cadeau. Houdt {A} het vol? Dan steelt {A}!' },
  { cat: 'pingpong', sec: 30, t: '{A} en {X} (30 sec): Noem om de beurt een SOORT FRUIT of GROENTE. Wie vastloopt, levert een cadeau in bij de ander!' },
  { cat: 'pingpong', sec: 30, t: '{A} en {O} (30 sec): Noem om de beurt een SPORT of SPELLETJE. Wie vastloopt, geeft een cadeau aan de winnaar!' },
  { cat: 'pingpong', sec: 30, t: '{A} en {L} (30 sec): Noem om de beurt iets dat je op een PIZZA of PANNENKOEK kunt doen. Wie vastloopt, verliest een cadeau aan de ander!' },
  // E: anti-spiek bluf & groeps-stemming
  { cat: 'bluf', sec: 0, t: '{A} en {O} houden allebei één cadeau omhoog. De groep beslist: wie heeft het ZWAARSTE cadeau vast? Diegene mag de twee cadeaus omruilen als hij dat wil!' },
  { cat: 'bluf', sec: 0, t: 'Geen spiek-kans! {X} steekt achter zijn eigen rug 1, 2 of 3 vingers op. {A}, raad hoeveel vingers het zijn! Goed = steel een cadeau van {X}! Fout = ruil een cadeau!' },
  { cat: 'bluf', sec: 0, t: '{A} wijst een cadeau van {X} aan. Op 3 steken jullie allebei 1 of 2 vingers in de lucht. Is het hetzelfde aantal? Dan wint {A} dat cadeau! Anders blijft het liggen.' },
  { cat: 'bluf', sec: 10, t: '{A}, wijs binnen 10 seconden aan wie in deze kamer na vandaag als EERSTVOLGENDE jarig is! Goed = steel een cadeau van diegene!' },
  { cat: 'bluf', sec: 0, t: '{A} en {X}: wie van jullie heeft op dit moment het mooiste cadeau voor zich liggen? De rest van de kamer stemt! De winnaar mag een extra cadeau met iemand naar keuze ruilen.' },
  { cat: 'bluf', sec: 0, t: '{A} doet eerst zijn ogen dicht! Daarna wijst {X} in stilte één iemand in de kamer aan die één keer \'Dag Sinterklaasje!\' roept. Raadt {A} wie het riep? Dan steelt hij een cadeau van die persoon!' },
  { cat: 'bluf', sec: 0, t: '{R} pakt stiekem (of doet alsof) een pepernoot of klein muntje in zijn linker- of rechtervuist. Raadt {A} in welke hand het zit? Dan steelt {A} een cadeau van {R}!' },
  { cat: 'stem', sec: 0, t: 'Tel tot 3 en wijs tegelijk aan: Wie in deze kamer kan het allerslechtst tegen zijn verlies bij spelletjes? Degene met de meeste vingers op zich gericht moet een cadeau ruilen met {A}!' },
  { cat: 'stem', sec: 0, t: 'Wijs op 3 allemaal tegelijk aan: Wie van jullie is altijd het langst bezig in de badkamer of voor de spiegel? De \'winnaar\' moet een cadeau wisselen met {A}!' },
  { cat: 'stem', sec: 0, t: 'Wijs op 3 allemaal tegelijk aan: Wie in deze kring kan het minst goed een geheim bewaren? Diegene moet een cadeau inleveren bij de persoon met de minste cadeaus!' },
  { cat: 'stem', sec: 0, t: 'Wijs op 3 allemaal tegelijk aan: Wie zit zijn beste cadeau op dit moment het meest stiekem te verstoppen of te bewaken? {A} mag precies dát cadeau nu bij diegene wegpakken (tenzij het in de Kluis ligt)!' },
  { cat: 'stem', sec: 0, t: 'Wie heeft er vanavond tot nu toe het meeste strooigoed of hapjes gegeten? Wijs op 3 naar de schuldige! Diegene moet één cadeau doorgeven aan {L}.' },
];
