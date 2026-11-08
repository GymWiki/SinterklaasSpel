/**
 * Gedeelde basis voor "De Pietenpakjes-race" (klas-spel): seedbare random, dobbelsteen-module en vragenbank.
 * Alles pure functies, zonder React, zodat het goed testbaar is.
 */
import g34 from './questions/groep34.json';
import g56 from './questions/groep56.json';
import g78 from './questions/groep78.json';

export type Level = 'g34' | 'g56' | 'g78';
export const LEVELS: { id: Level; label: string }[] = [
  { id: 'g34', label: 'Groep 3-4' },
  { id: 'g56', label: 'Groep 5-6' },
  { id: 'g78', label: 'Groep 7-8' },
];

/* ---------- seedbare random (mulberry32). De rng-state is een gewoon getal en past dus in localStorage ---------- */
export type Rng = number;
export function seedRng(seed: number): Rng {
  return seed >>> 0;
}
/** Geeft [waarde in [0,1), nieuwe rng-state]. */
export function rngNext(state: Rng): [number, Rng] {
  const s = (state + 0x6d2b79f5) >>> 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s];
}
export function rngInt(state: Rng, n: number): [number, Rng] {
  const [v, s] = rngNext(state);
  return [Math.floor(v * n), s];
}
export function rngShuffle<T>(state: Rng, arr: T[]): [T[], Rng] {
  const a = arr.slice();
  let s = state;
  for (let i = a.length - 1; i > 0; i--) {
    let j: number;
    [j, s] = rngInt(s, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return [a, s];
}

/* ---------- gedeelde dobbelsteen-module (de animatie zelf = components/Dice.tsx, het geluid = game/sound.ts) ---------- */
export const ROLL_MS = 1800;
export function rollDie(state: Rng): [number, Rng] {
  const [i, s] = rngInt(state, 6);
  return [i + 1, s];
}

/* ---------- vragenbank ---------- */
export type QType = 'rijm' | 'raadsel' | 'reken' | 'taal' | 'kennis' | 'beweging';
export interface Question {
  id: string;
  type: QType;
  tekst: string;
  /** leeg bij opdrachten waar de klas of leerkracht beslist (bijv. beweging) */
  antwoord?: string;
  /** tijdslimiet in seconden */
  tijd: number;
}
export const Q_LABEL: Record<QType, string> = {
  rijm: '🎶 Rijm-opdracht', raadsel: '🧩 Raadsel', reken: '🔢 Rekenen', taal: '📖 Taal', kennis: '🎅 Sinterklaaskennis', beweging: '🕺 Beweegopdracht',
};

const RAW: Record<Level, Omit<Question, 'id'>[]> = { g34: g34 as any, g56: g56 as any, g78: g78 as any };
export function questionBank(level: Level): Question[] {
  return RAW[level].map((q, i) => ({ ...q, id: `${level}-${i + 1}` }));
}

/** Trekt een vraag die nog niet gebruikt is in dit spel. Is de bank leeg, dan begint hij opnieuw. */
export function drawQuestion(level: Level, used: string[], rng: Rng): { q: Question; used: string[]; rng: Rng } {
  const bank = questionBank(level);
  let pool = bank.filter((q) => !used.includes(q.id));
  let u = used;
  if (!pool.length) {
    pool = bank;
    u = [];
  }
  const [i, r] = rngInt(rng, pool.length);
  return { q: pool[i], used: [...u, pool[i].id], rng: r };
}

/* ---------- kleuren ---------- */
export const TEAM_COLORS = [
  { name: 'rood', hex: '#ef4444' }, { name: 'blauw', hex: '#3b82f6' }, { name: 'groen', hex: '#22c55e' },
  { name: 'geel', hex: '#facc15' }, { name: 'oranje', hex: '#fb923c' }, { name: 'paars', hex: '#a855f7' },
  { name: 'roze', hex: '#ec4899' }, { name: 'turquoise', hex: '#14b8a6' },
];
export const AWARDS = ['Beste rijmers 🎶', 'Snelste denkers ⚡', 'Stilste team 🤫', 'Meeste teamgeest 🤝', 'Creatiefste antwoorden 🎨', 'Sportiefste team 🏅'];
