import { GENERAL_TARGET } from '@/lib/constants';
import { FEATURES } from '@/lib/features';
import { createState } from './engine';
import { saveLocal } from './store';
import type { GameState, Submission } from './types';

export const DEMO_ID = 'demo';
const names = ['Sander', 'Lisa', 'Tim', 'Noor', 'Daan', 'Emma'];

const raw: [string, string, 'secret' | 'poem', string][] = [
  ['Lisa', 'Tim', 'secret', 'Deze persoon heeft dit jaar stiekem de autosleutels in de kofferbak laten liggen en moest de ANWB bellen.'],
  ['Tim', 'Noor', 'secret', 'Vraag deze persoon nooit naar de hometrainer, die dient inmiddels als kapstok.'],
  ['Noor', 'Daan', 'poem', 'Sint zag het in zijn grote boek:\njij reed drie keer langs het huis, op zoek!'],
  ['Daan', GENERAL_TARGET, 'secret', 'Iedereen in deze groep heeft dit jaar minstens één keer "ik ben er bijna" geappt terwijl we nog op de bank zaten.'],
  ['Emma', 'Sander', 'secret', 'De kans is 100% dat deze persoon vanavond als eerste de pepernoten leegeet en doet alsof het de kat was.'],
  ['Sander', 'Lisa', 'secret', 'Deze persoon heeft op vakantie drie uur gezocht naar een hotel dat aan de overkant van de straat lag.'],
  ['Lisa', 'Emma', 'poem', 'Er is iemand hier, dat weet ik wel,\ndie snurkt zo hard in elk hotel!'],
  ['Tim', 'Lisa', 'secret', 'Deze persoon zegt altijd "ik ben over vijf minuten klaar" en is dan nog niet eens begonnen.'],
  ['Noor', 'Tim', 'secret', 'Deze persoon heeft ooit zout met suiker verward en het hele gezin de taart laten opeten.'],
  ['Daan', 'Noor', 'secret', 'Deze persoon googelt weleens haar eigen naam, geef het maar toe.'],
];

export function demoSubmissions(): Submission[] {
  return raw.map(([authorName, targetPlayerName, type, content], i) => ({ id: `demo${i}`, authorName, targetPlayerName, type, content }));
}

/** Zet een compleet voorbeeldspel (6 spelers, 10 inzendingen) in localStorage. */
export function loadDemo(): GameState {
  const s = createState(DEMO_ID, names, FEATURES.book ? demoSubmissions() : [], true);
  s.settings = { audience: 'mixed', r3Minutes: 20 };
  saveLocal(s);
  return s;
}

const klas = ['Anna', 'Bram', 'Chloé', 'Daan', 'Eva', 'Finn', 'Gijs', 'Hanna', 'Ilias', 'Julia', 'Kai', 'Lotte', 'Mees', 'Noa', 'Olivier', 'Puck', 'Quinn', 'Ruben', 'Sara', 'Thijs', 'Umi', 'Vera', 'Wout', 'Xena', 'Yara', 'Zoë', 'Amir', 'Bo', 'Cas', 'Dina', 'Elif', 'Fay'];

/** Demo van de Klassikale Modus: 32 leerlingen. */
export function loadDemoClass(): GameState {
  const s = createState(DEMO_ID, klas, [], true);
  s.settings = { audience: 'kids', r3Minutes: 20, mode: 'class' };
  s.youngestId = s.players[5].id;
  saveLocal(s);
  return s;
}
