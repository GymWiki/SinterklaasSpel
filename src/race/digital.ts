/**
 * Pietenpakjes-race, modus A (Digitaal): pure state machine, geen UI.
 * Alle regels worden hier afgedwongen:
 *  - een team met 1 pakje kan niet bestolen worden;
 *  - per ronde wordt een team maximaal één keer bestolen;
 *  - maximaal 6 pakjes per team (extra gaat terug naar het midden);
 *  - niemand eindigt met lege handen.
 * Elk pakje heeft een verborgen waarde: 1-5 pepernoten, 0 = Pietenpech, 8 = Gouden pakje.
 */
import { drawQuestion, rngInt, rngShuffle, rollDie, seedRng, ROLL_MS, type Level, type Question, type Rng } from './common';

export const MAX_PAKJES = 6;
export const GOLD = 8;
export const EXTRA_MS = 15_000;

export interface Pakje { id: number; v: number }
export interface Team { id: string; name: string; color: string; pakjes: Pakje[] }
export type DPhase = 'question' | 'answer' | 'rolling' | 'choose' | 'scoreboard' | 'finale' | 'awards' | 'done';
export interface DTimer { endsAt: number | null; remainingMs: number; paused: boolean; totalMs: number }

export interface Digital {
  v: 1;
  kind: 'digital';
  level: Level;
  rounds: number;
  round: number;
  rng: Rng;
  teams: Team[];
  middle: Pakje[];
  usedQ: string[];
  question: Question;
  phase: DPhase;
  timer: DTimer;
  correct: string[];
  queue: string[];
  roller: string | null;
  die: number | null;
  dieRevealAt: number;
  rollPending: boolean;
  rollDone: boolean;
  choose: { kind: 'steal' | 'swap'; options: string[] } | null;
  robbed: string[];
  message: string;
  finaleRevealed: number;
  awards: Record<string, string>;
}

export interface DigitalConfig {
  level: Level;
  rounds: number;
  teams: { name: string; color: string }[];
  seed: number;
}

/* ---------- hulpfuncties ---------- */
const sum = (p: Pakje[]) => p.reduce((a, x) => a + x.v, 0);
export const teamById = (s: Digital, id: string) => s.teams.find((t) => t.id === id)!;
const setTeam = (s: Digital, id: string, fn: (t: Team) => Team): Digital => ({ ...s, teams: s.teams.map((t) => (t.id === id ? fn(t) : t)) });

/** Pakjes-verdeling: 1-5 pepernoten, een paar Pietenpech (0), en Gouden pakjes (8). */
export function makeDeck(total: number, rng: Rng): [Pakje[], Rng] {
  const gold = Math.max(1, Math.round(total / 10));
  const pech = Math.max(2, Math.round(total / 7));
  const vals: number[] = [];
  for (let i = 0; i < gold; i++) vals.push(GOLD);
  for (let i = 0; i < pech; i++) vals.push(0);
  for (let i = 0; vals.length < total; i++) vals.push((i % 5) + 1);
  const [shuffled, r] = rngShuffle(rng, vals);
  return [shuffled.map((v, i) => ({ id: i + 1, v })), r];
}

/** Een pakje aan een team geven. Zit het team al op het maximum, dan gaat het pakje terug naar het midden. */
function give(s: Digital, teamId: string, p: Pakje): { s: Digital; returned: boolean } {
  const t = teamById(s, teamId);
  if (t.pakjes.length >= MAX_PAKJES) return { s: { ...s, middle: [...s.middle, p] }, returned: true };
  return { s: setTeam(s, teamId, (x) => ({ ...x, pakjes: [...x.pakjes, p] })), returned: false };
}

/** Pakt n pakjes uit het midden voor een team. Geeft ook terug hoeveel er echt bij kwamen. */
function gain(s: Digital, teamId: string, n: number): { s: Digital; got: number; returned: number } {
  let cur = s, got = 0, returned = 0;
  for (let i = 0; i < n; i++) {
    if (!cur.middle.length) break;
    const [p, ...rest] = cur.middle;
    cur = { ...cur, middle: rest };
    const r = give(cur, teamId, p);
    cur = r.s;
    if (r.returned) returned++;
    else got++;
  }
  return { s: cur, got, returned };
}

export const totals = (s: Digital) => s.teams.map((t) => ({ id: t.id, name: t.name, color: t.color, total: sum(t.pakjes), count: t.pakjes.length }));
export const winners = (s: Digital): string[] => {
  const t = totals(s);
  const max = Math.max(...t.map((x) => x.total));
  return t.filter((x) => x.total === max).map((x) => x.id);
};
/** Onthul-volgorde in de finale: laagste totaal eerst, zodat de winnaar als laatste komt. */
export const finaleOrder = (s: Digital) => totals(s).map((x, i) => ({ ...x, i })).sort((a, b) => a.total - b.total || a.i - b.i).map((x) => x.id);

/** Team met de minste pakjes dobbelt eerst (bij gelijk: volgorde van de teams). */
export function rollOrder(s: Digital, ids: string[]): string[] {
  return ids.map((id) => ({ id, n: teamById(s, id).pakjes.length, i: s.teams.findIndex((t) => t.id === id) })).sort((a, b) => a.n - b.n || a.i - b.i).map((x) => x.id);
}

export function stealOptions(s: Digital, rollerId: string): string[] {
  const me = teamById(s, rollerId).pakjes.length;
  return s.teams.filter((t) => t.id !== rollerId && t.pakjes.length > me && t.pakjes.length >= 2 && !s.robbed.includes(t.id)).map((t) => t.id);
}

/* ---------- timer ---------- */
const newTimer = (now: number, sec: number): DTimer => ({ endsAt: now + sec * 1000, remainingMs: sec * 1000, paused: false, totalMs: sec * 1000 });
export const timeLeftMs = (s: Digital, now: number) => (s.timer.paused || s.timer.endsAt === null ? s.timer.remainingMs : Math.max(0, s.timer.endsAt - now));

export function togglePause(s: Digital, now: number): Digital {
  if (s.phase !== 'question') return s;
  const t = s.timer;
  if (t.paused) return { ...s, timer: { ...t, paused: false, endsAt: now + t.remainingMs } };
  return { ...s, timer: { ...t, paused: true, remainingMs: timeLeftMs(s, now), endsAt: null } };
}
export function addTime(s: Digital, now: number): Digital {
  if (s.phase !== 'question') return s;
  const t = s.timer;
  if (t.paused) return { ...s, timer: { ...t, remainingMs: t.remainingMs + EXTRA_MS, totalMs: t.totalMs + EXTRA_MS } };
  return { ...s, timer: { ...t, endsAt: (t.endsAt ?? now) + EXTRA_MS, totalMs: t.totalMs + EXTRA_MS } };
}

/* ---------- spel starten ---------- */
export function createDigital(cfg: DigitalConfig, now: number): Digital {
  if (cfg.teams.length < 2 || cfg.teams.length > 6) throw new Error('Een digitaal spel heeft 2 tot 6 teams nodig.');
  const n = cfg.teams.length;
  let rng = seedRng(cfg.seed);
  let deck: Pakje[];
  [deck, rng] = makeDeck(n * 7, rng); // 1 startpakje per team + 6 per team in het midden
  const teams: Team[] = cfg.teams.map((t, i) => ({ id: `t${i + 1}`, name: t.name.trim() || `Team ${i + 1}`, color: t.color, pakjes: [deck[i]] }));
  const q = drawQuestion(cfg.level, [], rng);
  return {
    v: 1, kind: 'digital', level: cfg.level, rounds: cfg.rounds, round: 1, rng: q.rng, teams, middle: deck.slice(n),
    usedQ: q.used, question: q.q, phase: 'question', timer: newTimer(now, q.q.tijd), correct: [], queue: [], roller: null,
    die: null, dieRevealAt: 0, rollPending: false, rollDone: false, choose: null, robbed: [], message: '', finaleRevealed: 0, awards: {},
  };
}

/* ---------- vraag-fase ---------- */
function freshQuestion(s: Digital, now: number): Digital {
  const q = drawQuestion(s.level, s.usedQ, s.rng);
  return { ...s, question: q.q, usedQ: q.used, rng: q.rng, timer: newTimer(now, q.q.tijd), correct: [], phase: 'question' };
}
export function skipQuestion(s: Digital, now: number): Digital {
  return s.phase === 'question' ? freshQuestion(s, now) : s;
}
export function toAnswer(s: Digital, now: number): Digital {
  if (s.phase !== 'question') return s;
  return { ...s, phase: 'answer', timer: { ...s.timer, paused: true, remainingMs: timeLeftMs(s, now), endsAt: null } };
}
export function toggleCorrect(s: Digital, teamId: string): Digital {
  if (s.phase !== 'answer') return s;
  return { ...s, correct: s.correct.includes(teamId) ? s.correct.filter((x) => x !== teamId) : [...s.correct, teamId] };
}

/** Leerkracht bevestigt de goede teams: foute teams krijgen een troostpakje, goede teams gaan dobbelen. */
export function confirmCorrect(s: Digital): Digital {
  if (s.phase !== 'answer') return s;
  let cur: Digital = { ...s, robbed: [] };
  const wrong = s.teams.filter((t) => !s.correct.includes(t.id)).map((t) => t.id);
  let troost = 0;
  for (const id of wrong) {
    const g = gain(cur, id, 1);
    cur = g.s;
    troost += g.got;
  }
  const queue = rollOrder(cur, s.correct);
  const msg = wrong.length ? `Troostpakje voor ${wrong.map((id) => teamById(cur, id).name).join(', ')}${troost < wrong.length ? ' (waar mogelijk)' : ''}.` : 'Alle teams goed!';
  if (!queue.length) return endRound({ ...cur, message: msg });
  return { ...cur, queue, roller: queue[0], phase: 'rolling', die: null, rollPending: false, rollDone: false, choose: null, message: msg };
}

/* ---------- dobbelen ---------- */
export function roll(s: Digital, now: number): Digital {
  if (s.phase !== 'rolling' || !s.roller || s.rollPending || s.die !== null) return s;
  const [die, rng] = rollDie(s.rng);
  return { ...s, rng, die, rollPending: true, dieRevealAt: now + ROLL_MS, message: '' };
}

/** Voert de uitkomst van de worp uit zodra de dobbelsteen-animatie klaar is. */
export function tick(s: Digital, now: number): Digital {
  if (!s.rollPending || now < s.dieRevealAt || !s.roller || s.die === null) return s;
  const me = teamById(s, s.roller);
  const base: Digital = { ...s, rollPending: false };
  const takeMsg = (n: number) => (r: { s: Digital; got: number; returned: number }): Digital => {
    const parts: string[] = [];
    if (r.got) parts.push(`${me.name} pakt ${r.got === 1 ? '1 pakje' : `${r.got} pakjes`} uit het midden`);
    if (r.returned) parts.push(`${me.name} zit vol (max. ${MAX_PAKJES}): ${r.returned === 1 ? 'het extra pakje gaat' : 'extra pakjes gaan'} terug naar het midden`);
    if (!r.got && !r.returned) parts.push('Het midden is leeg: er valt niets te pakken');
    void n;
    return { ...r.s, rollDone: true, message: parts.join('. ') + '.' };
  };
  switch (s.die) {
    case 1:
    case 2:
      return takeMsg(1)(gain(base, me.id, 1));
    case 5:
      return takeMsg(2)(gain(base, me.id, 2));
    case 3: {
      const options = stealOptions(base, me.id);
      if (!options.length) {
        const r = gain(base, me.id, 1);
        return { ...takeMsg(1)(r), message: `Niemand om te bestelen (een team met 1 pakje is veilig). ${takeMsg(1)(r).message}` };
      }
      return { ...base, phase: 'choose', choose: { kind: 'steal', options }, message: `${me.name}: van welk team pak je een pakje?` };
    }
    case 4: {
      // Schudpiet: elk team geeft één (willekeurig) pakje naar links = het volgende team in de rij
      let cur = base;
      const given: (Pakje | null)[] = [];
      for (const t of cur.teams) {
        if (!t.pakjes.length) { given.push(null); continue; }
        let i: number;
        [i, cur] = (() => { const [x, r] = rngInt(cur.rng, t.pakjes.length); return [x, { ...cur, rng: r }] as [number, Digital]; })();
        given.push(t.pakjes[i]);
      }
      cur = { ...cur, teams: cur.teams.map((t, k) => ({ ...t, pakjes: given[k] ? t.pakjes.filter((p) => p.id !== given[k]!.id) : t.pakjes })) };
      const n = cur.teams.length;
      for (let k = 0; k < n; k++) {
        const p = given[k];
        if (!p) continue;
        cur = give(cur, cur.teams[(k + 1) % n].id, p).s;
      }
      return { ...cur, rollDone: true, message: 'Schudpiet! Elk team geeft één pakje door naar links.' };
    }
    default: // 6: Sinterklaas
      return { ...base, phase: 'choose', choose: { kind: 'swap', options: s.teams.filter((t) => t.id !== me.id).map((t) => t.id) }, message: `Sinterklaas! ${me.name} mag de stapel ruilen met een team naar keuze.` };
  }
}

export function chooseTeam(s: Digital, targetId: string): Digital {
  if (s.phase !== 'choose' || !s.choose || !s.roller || !s.choose.options.includes(targetId)) return s;
  const me = teamById(s, s.roller), target = teamById(s, targetId);
  if (s.choose.kind === 'steal') {
    const [i, rng] = rngInt(s.rng, target.pakjes.length);
    const p = target.pakjes[i];
    let cur: Digital = setTeam({ ...s, rng }, target.id, (t) => ({ ...t, pakjes: t.pakjes.filter((x) => x.id !== p.id) }));
    cur = give(cur, me.id, p).s;
    return { ...cur, phase: 'rolling', choose: null, rollDone: true, robbed: [...s.robbed, target.id], message: `${me.name} pakt een pakje van ${target.name}!` };
  }
  let cur = setTeam(s, me.id, (t) => ({ ...t, pakjes: target.pakjes }));
  cur = setTeam(cur, target.id, (t) => ({ ...t, pakjes: me.pakjes }));
  return { ...cur, phase: 'rolling', choose: null, rollDone: true, message: `${me.name} ruilt de stapel met ${target.name}!` };
}
export function skipSwap(s: Digital): Digital {
  if (s.phase !== 'choose' || s.choose?.kind !== 'swap') return s;
  return { ...s, phase: 'rolling', choose: null, rollDone: true, message: 'Geen ruil: Sinterklaas laat alles zoals het is.' };
}

function advanceRoller(s: Digital): Digital {
  if (s.phase !== 'rolling' || !s.rollDone) return s;
  const queue = s.queue.slice(1);
  if (!queue.length) return endRound({ ...s, queue, roller: null });
  return { ...s, queue, roller: queue[0], die: null, rollDone: false, rollPending: false, message: '' };
}

/** Einde van een ronde: niemand met lege handen. */
function endRound(s: Digital): Digital {
  let cur = s;
  for (const t of s.teams) if (teamById(cur, t.id).pakjes.length === 0) cur = gain(cur, t.id, 1).s;
  return { ...cur, phase: 'scoreboard', roller: null, die: null, rollDone: false, rollPending: false, choose: null };
}

export function nextRound(s: Digital, now: number): Digital {
  if (s.phase !== 'scoreboard') return s;
  if (s.round >= s.rounds) return { ...s, phase: 'finale', finaleRevealed: 0, message: '' };
  return freshQuestion({ ...s, round: s.round + 1, robbed: [], message: '' }, now);
}

/* ---------- finale ---------- */
export function revealNext(s: Digital): Digital {
  if (s.phase !== 'finale') return s;
  const r = s.finaleRevealed + 1;
  return { ...s, finaleRevealed: r, phase: r >= s.teams.length ? 'awards' : 'finale' };
}
export function setAward(s: Digital, teamId: string, award: string | null): Digital {
  if (s.phase !== 'awards' && s.phase !== 'done') return s;
  const awards = { ...s.awards };
  for (const k of Object.keys(awards)) if (awards[k] === award) delete awards[k]; // elke prijs gaat naar één team
  if (award) awards[teamId] = award;
  else delete awards[teamId];
  return { ...s, awards };
}

/** Spatiebalk: ga naar de volgende fase. */
export function primary(s: Digital, now: number): Digital {
  switch (s.phase) {
    case 'question': return toAnswer(s, now);
    case 'answer': return confirmCorrect(s);
    case 'rolling':
      if (s.rollDone) return advanceRoller(s);
      return roll(s, now);
    case 'scoreboard': return nextRound(s, now);
    case 'finale': return revealNext(s);
    case 'awards': return { ...s, phase: 'done' };
    default: return s;
  }
}

/** Voor tests en debugging: schendingen van de spelregels. */
export function checkInvariants(s: Digital, totalPakjes: number): string[] {
  const bad: string[] = [];
  const ids = [...s.middle, ...s.teams.flatMap((t) => t.pakjes)].map((p) => p.id);
  if (ids.length !== totalPakjes) bad.push(`aantal pakjes ${ids.length} != ${totalPakjes}`);
  if (new Set(ids).size !== ids.length) bad.push('dubbel pakje');
  for (const t of s.teams) {
    if (t.pakjes.length > MAX_PAKJES) bad.push(`${t.name} heeft meer dan ${MAX_PAKJES}`);
    if (t.pakjes.length === 0) bad.push(`${t.name} heeft lege handen`);
  }
  if (new Set(s.robbed).size !== s.robbed.length) bad.push('team meer dan één keer bestolen in een ronde');
  return bad;
}
