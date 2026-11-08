/**
 * Pietenpakjes-race, modus B (Met echte pakjes): de hele klas zit in een kring, de tv bepaalt wat iedereen doet.
 * Pure state machine, geen UI. Altijd ruilen, nooit afpakken. Elke 2 rondes volgt een Pietenvraag.
 */
import { drawQuestion, rngInt, rngShuffle, rollDie, seedRng, ROLL_MS, TEAM_COLORS, type Level, type Question, type Rng } from './common';
import { EXTRA_MS, type DTimer } from './digital';

export interface Kid { id: string; name: string; color?: string }
export type RPhase = 'ready' | 'rolling' | 'result' | 'question' | 'answer' | 'finaleCountdown' | 'finale' | 'done';

export interface RealResult {
  die: number;
  title: string;
  text: string;
  arrow?: 'left' | 'right';
  /** koppels die ruilen (kind-ids) */
  pairs?: [string, string][];
  /** kinderen die niemand hebben om mee te ruilen (bij een oneven aantal) */
  unpaired?: string[];
  color?: { name: string; hex: string };
  /** kinderen die de gekozen kleur dragen (alleen als er kleuren zijn ingesteld) */
  wearers?: string[];
  /** door de tv gekozen kinderen (Pietenvraag / Sinterklaas) */
  chosen?: string[];
}

export interface Real {
  v: 1;
  kind: 'real';
  level: Level;
  rounds: number;
  round: number;
  rng: Rng;
  kids: Kid[];
  usedQ: string[];
  phase: RPhase;
  die: number | null;
  dieRevealAt: number;
  rollPending: boolean;
  result: RealResult | null;
  question: Question | null;
  questionKids: string[];
  qDone: boolean;
  timer: DTimer;
  countdown: number;
  countdownEndsAt: number;
}

export interface RealConfig {
  level: Level;
  rounds: number;
  kids: { name: string; color?: string }[];
  seed: number;
}

export const COUNTDOWN_FROM = 5;
export const kidById = (s: Real, id: string) => s.kids.find((k) => k.id === id)!;
export const kidName = (s: Real, id: string) => kidById(s, id)?.name ?? '?';

/** "Aantal kinderen" i.p.v. namen: de kinderen krijgen nummers. */
export function numberedKids(n: number): { name: string }[] {
  return Array.from({ length: n }, (_, i) => ({ name: String(i + 1) }));
}

/** Overbuur-koppels: kind i ruilt met het kind recht tegenover in de kring. Bij een oneven aantal blijft er één over. */
export function oppositePairs(n: number): { pairs: [number, number][]; unpaired: number[] } {
  const h = Math.floor(n / 2);
  const off = n % 2 === 0 ? h : h + 1;
  const pairs: [number, number][] = [];
  for (let i = 0; i < h; i++) pairs.push([i, i + off]);
  return { pairs, unpaired: n % 2 === 0 ? [] : [h] };
}

const newTimer = (now: number, sec: number): DTimer => ({ endsAt: now + sec * 1000, remainingMs: sec * 1000, paused: false, totalMs: sec * 1000 });
export const timeLeftMs = (s: Real, now: number) => (s.timer.paused || s.timer.endsAt === null ? s.timer.remainingMs : Math.max(0, s.timer.endsAt - now));

export function createReal(cfg: RealConfig, now: number): Real {
  if (cfg.kids.length < 3 || cfg.kids.length > 40) throw new Error('Een klas-spel heeft 3 tot 40 kinderen nodig.');
  const q = drawQuestion(cfg.level, [], seedRng(cfg.seed));
  return {
    v: 1, kind: 'real', level: cfg.level, rounds: cfg.rounds, round: 1, rng: q.rng,
    kids: cfg.kids.map((k, i) => ({ id: `k${i + 1}`, name: k.name.trim() || String(i + 1), color: k.color })),
    usedQ: [], phase: 'ready', die: null, dieRevealAt: 0, rollPending: false, result: null, question: null, questionKids: [], qDone: false,
    timer: newTimer(now, 30), countdown: COUNTDOWN_FROM, countdownEndsAt: 0,
  };
}

function pickKids(s: Real, count: number): [string[], Real] {
  const [shuffled, rng] = rngShuffle(s.rng, s.kids.map((k) => k.id));
  return [shuffled.slice(0, Math.min(count, s.kids.length)), { ...s, rng }];
}

export function roll(s: Real, now: number): Real {
  if (s.phase !== 'ready') return s;
  const [die, rng] = rollDie(s.rng);
  return { ...s, rng, die, rollPending: true, phase: 'rolling', dieRevealAt: now + ROLL_MS, result: null };
}

function resolve(s: Real): Real {
  const die = s.die!;
  switch (die) {
    case 1: return { ...s, phase: 'result', rollPending: false, result: { die, title: 'Alles naar links', arrow: 'left', text: 'Iedereen geeft zijn pakje door aan de buurman LINKS van zich!' } };
    case 2: return { ...s, phase: 'result', rollPending: false, result: { die, title: 'Alles naar rechts', arrow: 'right', text: 'Iedereen geeft zijn pakje door aan de buurman RECHTS van zich!' } };
    case 3: {
      const { pairs, unpaired } = oppositePairs(s.kids.length);
      return {
        ...s, phase: 'result', rollPending: false,
        result: {
          die, title: 'Ruil met de overbuur', pairs: pairs.map(([a, b]) => [s.kids[a].id, s.kids[b].id]), unpaired: unpaired.map((i) => s.kids[i].id),
          text: 'Ruil je pakje met het kind recht tegenover je in de kring!',
        },
      };
    }
    case 4: {
      // Kleurenpiet: kies bij voorkeur een kleur die echt voorkomt, zodat er kinderen zijn die ruilen
      const inUse = TEAM_COLORS.filter((c) => s.kids.some((k) => k.color === c.name));
      const pool = inUse.length ? inUse : TEAM_COLORS;
      const [i, rng] = rngInt(s.rng, pool.length);
      const color = pool[i];
      const wearers = inUse.length ? s.kids.filter((k) => k.color === color.name).map((k) => k.id) : [];
      const used = new Set<number>();
      const pairs: [string, string][] = [];
      const unpaired: string[] = [];
      const n = s.kids.length;
      for (const id of wearers) {
        const idx = s.kids.findIndex((k) => k.id === id);
        if (used.has(idx)) continue;
        const cand = [(idx + 1) % n, (idx - 1 + n) % n].find((j) => j !== idx && !used.has(j));
        if (cand === undefined) { unpaired.push(id); continue; }
        used.add(idx); used.add(cand);
        pairs.push([id, s.kids[cand].id]);
      }
      return {
        ...s, rng, phase: 'result', rollPending: false,
        result: {
          die, title: 'Kleurenpiet', color, wearers, pairs, unpaired,
          text: `Wie ${color.name} draagt ruilt zijn pakje met de buurman!`,
        },
      };
    }
    case 5: {
      const [chosen, s2] = pickKids(s, 3);
      return { ...s2, phase: 'result', rollPending: false, qDone: true, result: { die, title: 'Pietenvraag', chosen, text: 'Wie van hen goed antwoordt, mag met een kind naar keuze ruilen!' } };
    }
    default: {
      const [chosen, s2] = pickKids(s, 3);
      return { ...s2, phase: 'result', rollPending: false, result: { die, title: 'Sinterklaas!', chosen, text: 'Deze kinderen mogen met IEDEREEN ruilen die ze willen!' } };
    }
  }
}

function startQuestion(s: Real, now: number, kids: string[]): Real {
  const q = drawQuestion(s.level, s.usedQ, s.rng);
  return { ...s, question: q.q, usedQ: q.used, rng: q.rng, questionKids: kids, phase: 'question', timer: newTimer(now, q.q.tijd) };
}

export function skipQuestion(s: Real, now: number): Real {
  return s.phase === 'question' ? startQuestion(s, now, s.questionKids) : s;
}
export function toAnswer(s: Real, now: number): Real {
  if (s.phase !== 'question') return s;
  return { ...s, phase: 'answer', timer: { ...s.timer, paused: true, remainingMs: timeLeftMs(s, now), endsAt: null } };
}
export function togglePause(s: Real, now: number): Real {
  if (s.phase !== 'question') return s;
  const t = s.timer;
  if (t.paused) return { ...s, timer: { ...t, paused: false, endsAt: now + t.remainingMs } };
  return { ...s, timer: { ...t, paused: true, remainingMs: timeLeftMs(s, now), endsAt: null } };
}
export function addTime(s: Real, now: number): Real {
  if (s.phase !== 'question') return s;
  const t = s.timer;
  if (t.paused) return { ...s, timer: { ...t, remainingMs: t.remainingMs + EXTRA_MS, totalMs: t.totalMs + EXTRA_MS } };
  return { ...s, timer: { ...t, endsAt: (t.endsAt ?? now) + EXTRA_MS, totalMs: t.totalMs + EXTRA_MS } };
}

/** Einde van een ronde: eerst (om de 2 rondes) een Pietenvraag, daarna de volgende ronde of de finale. */
function endRound(s: Real, now: number): Real {
  if (!s.qDone && s.round % 2 === 0) {
    const [kids, s2] = pickKids(s, 3);
    return startQuestion({ ...s2, qDone: true }, now, kids);
  }
  if (s.round >= s.rounds) return { ...s, phase: 'finaleCountdown', countdown: COUNTDOWN_FROM, countdownEndsAt: now + 1000, result: null, question: null };
  return { ...s, round: s.round + 1, qDone: false, phase: 'ready', die: null, result: null, question: null, questionKids: [] };
}

export function tick(s: Real, now: number): Real {
  if (s.rollPending && s.die !== null && now >= s.dieRevealAt) return resolve(s);
  if (s.phase === 'finaleCountdown' && now >= s.countdownEndsAt) {
    if (s.countdown <= 1) return { ...s, countdown: 0, phase: 'finale' };
    return { ...s, countdown: s.countdown - 1, countdownEndsAt: s.countdownEndsAt + 1000 };
  }
  return s;
}

/** Spatiebalk: volgende fase. */
export function primary(s: Real, now: number): Real {
  switch (s.phase) {
    case 'ready': return roll(s, now);
    case 'result':
      if (s.result?.die === 5) return startQuestion(s, now, s.result.chosen ?? []);
      return endRound(s, now);
    case 'question': return toAnswer(s, now);
    case 'answer': return endRound(s, now);
    case 'finale': return { ...s, phase: 'done' };
    default: return s;
  }
}

/** Voor tests: schendingen van de regels in een resultaat (altijd ruilen, koppels zijn disjunct). */
export function checkResult(s: Real): string[] {
  const bad: string[] = [];
  const r = s.result;
  if (!r) return bad;
  const seen = new Set<string>();
  for (const [a, b] of r.pairs ?? []) {
    if (a === b) bad.push('kind ruilt met zichzelf');
    for (const id of [a, b]) { if (seen.has(id)) bad.push(`kind ${id} zit in twee koppels`); seen.add(id); }
  }
  if (/afpak|steel|pak .* af/i.test(r.text)) bad.push('afpakken is niet toegestaan');
  if (r.chosen && new Set(r.chosen).size !== r.chosen.length) bad.push('dubbel gekozen kind');
  return bad;
}
