/**
 * Pure GameEngine (geen React, geen netwerk). Alle functies nemen een state + `now` en geven een nieuwe state terug.
 * Bij "niets te doen" geven ze exact dezelfde referentie terug, zodat de UI niet onnodig schrijft naar localStorage.
 *
 * Zitkring: players[0] = de host (6 uur), daarna met de klok mee. De volgende index is dus de buurman LINKS van je
 * (gezien vanaf je stoel, gezicht naar het midden); de vorige index zit rechts.
 */
import { forAudience, type Audience } from '@/content/tags';
import { R1_FIXED, type TaskTpl } from '@/content/round1';
import { R2_FIXED } from '@/content/round2';
import { DECK, DECK_CATS } from '@/content/deck';
import { FEATURES } from '@/lib/features';
import { CHAOS, R3_FOOT, R3_MIJTER, R3_REVERSE, R3_SHIFT, R3_SHIFT_SUB, R3_STEAL, R3_VAULT } from '@/content/round3';
import { BOOK_FALLBACK, BOOK_FALLBACK_REVEAL } from '@/content/book';
import { GENERAL_TARGET } from '@/lib/constants';
import type {
  BookCard, DeckState, Effect, FxName, GameState, Phase, Player, Rich, Submission, Task, TaskKind, Turn,
} from './types';

export const COLORS = [
  '#ff5d73', '#ffb347', '#ffe14d', '#7dff8a', '#4de1ff', '#8ea2ff',
  '#d68bff', '#ff8bd1', '#5fffc8', '#ff9b5e', '#b6e84a', '#6ec6ff', '#f58bff', '#ffd1a3', '#9cf0ff', '#c8ff7a',
];
export const ICONS = ['🎅', '🤶', '🧝', '🦌', '⛄', '🎁', '🍪', '🥜', '🎄', '⭐', '🚢', '👑', '🐴', '🔔', '🍬', '🧦'];

export const TURN_LIMIT_MS = 20_000;
export const TENSION_MS = 5 * 60_000;
export const TURBO_MS = 2 * 60_000;
export const ROLL_MS = 1800;
export const ROLL_TURBO_MS = 700;
export const NEXT_LOCKOUT_MS = 900;
export const DRUM_MS = 2800;

const rand = () => Math.random();
const randInt = (n: number) => Math.floor(rand() * n);
const pick = <T,>(a: T[]): T => a[randInt(a.length)];
export function shuffle<T>(a: T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}
const clean = (s: string) => s.replace(/[{}]/g, '');
const rich = (tpl: string, slots: Record<string, string> = {}): Rich => ({ tpl, slots });

/* ---------- opbouw ---------- */

export function makePlayer(name: string, index: number, existing: Player[] = []): Player {
  const usedC = new Set(existing.map((p) => p.color));
  const usedI = new Set(existing.map((p) => p.icon));
  const color = COLORS.find((c) => !usedC.has(c)) ?? COLORS[index % COLORS.length];
  const icon = ICONS.find((c) => !usedI.has(c)) ?? ICONS[index % ICONS.length];
  return { id: `p${Date.now().toString(36)}${randInt(1e6).toString(36)}`, name: clean(name.trim()).slice(0, 24), paused: false, color, icon };
}

export function createState(roomId: string, names: string[], submissions: Submission[], isDemo = false): GameState {
  const players: Player[] = [];
  names.forEach((n, i) => players.push(makePlayer(n, i, players)));
  return {
    v: 2, rev: 1, roomId, isDemo, phase: 'lobby',
    settings: { audience: 'mixed', r3Minutes: 30 },
    players, submissions, removedIds: [], loadedAt: Date.now(),
    direction: 1, locks: [], mijter: null, turn: null, turnCount: 0, decks: {}, youngestId: null,
    book: { queue: [], usedIds: [], lastTargets: [], fallback: { queue: [], last: null } },
    r3: null, banner: null, fx: null,
  };
}

const bump = (s: GameState, patch: Partial<GameState>, fx?: FxName): GameState => ({
  ...s, ...patch, rev: s.rev + 1,
  fx: fx ? { id: (s.fx?.id ?? 0) + 1, name: fx } : (patch.fx !== undefined ? patch.fx : s.fx),
});

/* ---------- zitkring ---------- */

export const activePlayers = (s: GameState) => s.players.filter((p) => !p.paused);
export const playerById = (s: GameState, id: string | null | undefined) => s.players.find((p) => p.id === id);
export const maxLocks = (s: GameState) => Math.max(1, Math.floor(activePlayers(s).length / 3));

export function seatContext(s: GameState, activeId: string) {
  const act = activePlayers(s);
  const m = act.length;
  const i = Math.max(0, act.findIndex((p) => p.id === activeId));
  const A = act[i] ?? s.players[0];
  const L = act[(i + 1) % m] ?? A;
  const R = act[(i - 1 + m) % m] ?? A;
  const O = act[(i + Math.floor(m / 2)) % m] ?? A;
  const others = act.filter((p) => p.id !== A.id);
  const fresh = others.filter((p) => p.id !== L.id && p.id !== R.id && p.id !== O.id);
  const X = pick(fresh.length ? fresh : others.length ? others : [A]);
  return { A, L, R, O, X };
}

export function nextActiveId(s: GameState, fromId: string, dir: 1 | -1 = s.direction): string {
  const n = s.players.length;
  const start = s.players.findIndex((p) => p.id === fromId);
  for (let step = 1; step <= n; step++) {
    const p = s.players[(((start + dir * step) % n) + n) % n];
    if (p && !p.paused) return p.id;
  }
  return fromId;
}

export const inTension = (s: GameState, now: number) => s.phase === 'round3' && !!s.r3 && now >= s.r3.endAt - TENSION_MS;
export const inTurbo = (s: GameState, now: number) => s.phase === 'round3' && !!s.r3 && now >= s.r3.endAt - TURBO_MS;

/* ---------- Smart Deck ---------- */

function drawDeck(decks: Record<string, DeckState>, key: string, len: number): { idx: number; decks: Record<string, DeckState> } {
  const d = decks[key] ?? { queue: [], last: null };
  let queue = d.queue.filter((i) => i < len);
  if (!queue.length) {
    queue = shuffle(Array.from({ length: len }, (_, i) => i));
    if (len > 1 && queue[0] === d.last) [queue[0], queue[queue.length - 1]] = [queue[queue.length - 1], queue[0]];
  }
  const idx = queue[0];
  return { idx, decks: { ...decks, [key]: { queue: queue.slice(1), last: idx } } };
}

function pickTpl(s: GameState, key: string, items: TaskTpl[]): { tpl: TaskTpl; decks: Record<string, DeckState> } {
  const list = forAudience(items, s.settings.audience);
  const { idx, decks } = drawDeck(s.decks, `${key}:${s.settings.audience}`, list.length);
  return { tpl: list[idx], decks };
}

function pickStr(s: GameState, key: string, items: string[]): { text: string; decks: Record<string, DeckState> } {
  const { idx, decks } = drawDeck(s.decks, key, items.length);
  return { text: items[idx], decks };
}

/* ---------- Grote Boek ---------- */

function drawBook(s: GameState, activeName: string): { card: BookCard; fallback?: DeckState } {
  const subs = s.book.queue
    .map((id) => s.submissions.find((x) => x.id === id))
    .filter((x): x is Submission => !!x && !s.book.usedIds.includes(x.id));
  const [t1, t2] = [s.book.lastTargets[s.book.lastTargets.length - 2], s.book.lastTargets[s.book.lastTargets.length - 1]];
  const ok = subs.filter((x) => !(t1 && t1 === t2 && x.targetPlayerName === t1));
  if (ok.length) {
    let best = ok[0];
    let bestScore = -1;
    for (const c of ok) {
      const sc = (c.targetPlayerName !== activeName ? 2 : 0) + (c.authorName !== activeName ? 1 : 0);
      if (sc > bestScore) { best = c; bestScore = sc; }
    }
    return { card: { id: best.id, source: 'submission', type: best.type, content: best.content, target: best.targetPlayerName } };
  }
  const list = forAudience(BOOK_FALLBACK, s.settings.audience);
  const { idx, decks } = drawDeck({ fallback: s.book.fallback }, 'fallback', list.length);
  return { card: { id: `b${s.settings.audience}${idx}`, source: 'builtin', type: 'dilemma', content: list[idx].q, target: null }, fallback: decks.fallback };
}

/* ---------- taken bouwen ---------- */

interface Built { task: Task; effects: Effect[]; decks: Record<string, DeckState>; book?: GameState['book'] }

function slotsOf(c: ReturnType<typeof seatContext>): Record<string, string> {
  return { A: c.A.id, L: c.L.id, R: c.R.id, O: c.O.id, X: c.X.id };
}

function buildRound1(s: GameState, die: number, activeId: string): Built {
  const c = seatContext(s, activeId);
  const f = R1_FIXED[die];
  const task: Task = {
    kind: f.kind, title: f.title, emoji: f.emoji, main: rich(f.main, slotsOf(c)),
    sub: f.sub ? rich(f.sub) : undefined, arrow: f.arrow, highlight: [c.A.id],
  };
  return { task, effects: [], decks: s.decks };
}

const dirText = (d: 1 | -1) => (d === 1 ? 'met de klok mee' : 'tegen de klok in');
const tokensIn = (t: string) => Array.from(new Set(Array.from(t.matchAll(/\{([ALROX])\}/g), (m) => m[1])));

/** Trek 1 kaart uit het Opdrachten-Deck (ronde 2 & 3 delen één Smart Deck: geen herhaling). */
function deckTask(s: GameState, c: ReturnType<typeof seatContext>, round: 2 | 3): Built {
  const { idx, decks } = drawDeck(s.decks, 'deck', DECK.length);
  const card = DECK[idx];
  const others = activePlayers(s).filter((p) => p.id !== c.A.id);
  const pool = round === 3 ? others.filter((p) => p.id !== s.mijter) : others; // de Mijter is immuun voor stelen
  const X = pick(pool.length ? pool : others.length ? others : [c.A]);
  const slots: Record<string, string> = { ...slotsOf(c), X: X.id };
  const hl = tokensIn(card.t).map((k) => slots[k]);
  const cat = DECK_CATS[card.cat];
  const task: Task = {
    kind: 'deck', emoji: cat.emoji, title: cat.title, main: rich(card.t, slots),
    sub: rich(round === 2 ? 'Cadeau gewonnen of gestolen dat nog ingepakt is? Pak het dan direct uit!' : 'Een cadeau in de Kluis 🔒 of van de Mijter 🛡️ mag niet worden gestolen.'),
    timerSec: card.sec > 0 ? card.sec : undefined,
    highlight: Array.from(new Set([c.A.id, ...hl])),
  };
  return { task, effects: [], decks };
}

function buildRound2(s: GameState, die: number, activeId: string): Built {
  const c = seatContext(s, activeId);
  if (die === 4) return deckTask(s, c, 2);
  const f = R2_FIXED[die];
  const slots = slotsOf(c);
  const task: Task = {
    kind: f.kind, title: f.title, emoji: f.emoji, main: rich(f.main, slots), sub: f.sub ? rich(f.sub, slots) : undefined,
    highlight: [c.A.id, ...(f.with ?? []).map((k) => slots[k])],
  };
  return { task, effects: [], decks: s.decks };
}

function buildRound3(s: GameState, die: number, activeId: string): Built {
  const c = seatContext(s, activeId);
  const slots = slotsOf(c);
  const A = c.A.id;

  if (die === 1) {
    const { text, decks } = pickStr(s, 'r3:steal', R3_STEAL);
    const hl = [A, ...(text.includes('{L}') ? [c.L.id, c.R.id] : text.includes('{O}') ? [c.O.id] : [])];
    return { task: { kind: 'steal', emoji: '🕵️', title: 'GEWOON STELEN', main: rich(text, slots), highlight: hl, foot: R3_FOOT }, effects: [], decks };
  }
  if (die === 2) {
    const arrow: 'cw' | 'ccw' = s.direction === 1 ? 'cw' : 'ccw'; // met de huidige speelrichting mee
    const { text, decks } = pickStr(s, 'r3:shift', R3_SHIFT);
    const parts: string[] = [R3_SHIFT_SUB];
    const sl: Record<string, string> = { A };
    const mj = s.mijter && playerById(s, s.mijter);
    if (mj && !mj.paused) { parts.push('🛡️ {M} heeft de Mijter en doet niet mee.'); sl.M = mj.id; }
    if (s.locks.length) parts.push('🔒 Cadeaus in de Kluis blijven liggen.');
    return {
      task: { kind: 'shift', emoji: '🔁', title: 'GROEPS-SCHUIF', arrow, main: rich(text.replace('{DIR}', dirText(arrow === 'cw' ? 1 : -1)), sl), sub: rich(parts.join(' '), sl), highlight: [A], foot: R3_FOOT },
      effects: [], decks,
    };
  }
  if (die === 3) {
    if (rand() < 0.5) {
      const { text, decks } = pickStr(s, 'r3:vault', R3_VAULT);
      const max = maxLocks(s);
      const already = s.locks.includes(A);
      let sub: Rich;
      if (already) sub = rich('{A} had al een slotje 🔒 en mag het op een ander cadeau zetten.', { A });
      else if (s.locks.length >= max) sub = rich('Alle slotjes zijn bezet: het slotje van {OLD} verhuist naar {A}!', { OLD: s.locks[0], A });
      else sub = rich(`Slotjes in gebruik: ${s.locks.length + 1} van ${max}.`);
      return { task: { kind: 'vault', emoji: '🔒', title: 'DE KLUIS', main: rich(text, { A }), sub, highlight: [A, ...(s.locks.length >= max && !already ? [s.locks[0]] : [])] }, effects: [{ t: 'lock', id: A }], decks };
    }
    const { text, decks } = pickStr(s, 'r3:mijter', R3_MIJTER);
    let sub: Rich | undefined;
    if (s.mijter && s.mijter !== A && playerById(s, s.mijter)) sub = rich('De Mijter verhuist van {OLD} naar {A}!', { OLD: s.mijter, A });
    else if (s.mijter === A) sub = rich('Je had hem al! Hou hem maar vast.');
    return { task: { kind: 'mijter', emoji: '🛡️', title: 'DE MIJTER', main: rich(text, { A }), sub, highlight: [A] }, effects: [{ t: 'mijter', id: A }], decks };
  }
  if (die === 4) return deckTask(s, c, 3);
  if (die === 5) {
    const nd = (s.direction === 1 ? -1 : 1) as 1 | -1;
    const { text, decks } = pickStr(s, 'r3:reverse', R3_REVERSE);
    return {
      task: { kind: 'reverse', emoji: '🔄', title: 'RICHTING OMDRAAIEN', arrow: nd === 1 ? 'cw' : 'ccw', main: rich(text.replace('{DIR}', dirText(nd)), slots), highlight: [A, c.L.id, c.R.id] },
      effects: [{ t: 'reverse' }], decks,
    };
  }
  if (!FEATURES.book) {
    // Gooi 6: Chaos van Piet — Chaos-Deck van 6 kaarten
    const { idx, decks } = drawDeck(s.decks, 'chaos', CHAOS.length);
    const card = CHAOS[idx];
    const others = activePlayers(s).filter((p) => p.id !== A);
    const X = pick(others.length ? others : [c.A]);
    const sl = { ...slots, X: X.id };
    const effects: Effect[] = [];
    let kind: TaskKind = 'chaos';
    let hl = [A];
    if (card.effect === 'SWAP_SEATS_TARGET') { effects.push({ t: 'swap', a: A, b: X.id }); kind = 'chairs'; hl = [A, X.id]; }
    else if (card.effect === 'SWAP_SEATS_OPPOSITE') { effects.push({ t: 'swap', a: A, b: c.O.id }); kind = 'chairs'; hl = [A, c.O.id]; }
    else if (card.effect === 'CLEAR_VAULTS') effects.push({ t: 'clearLocks' });
    else if (card.effect === 'CLAIM_MITRE') effects.push({ t: 'mijter', id: A });
    else if (card.t.includes('{X}')) hl = [A, X.id];
    return { task: { kind, emoji: '⚡', title: `CHAOS VAN PIET: ${card.title}`, main: rich(card.t, sl), highlight: hl }, effects, decks };
  }
  // book
  const { card, fallback } = drawBook(s, c.A.name);
  return {
    task: {
      kind: 'book', emoji: '📖', title: 'HET GROTE BOEK VAN SINTERKLAAS',
      main: rich('Sinterklaas leest voor uit Het Grote Boek:'), highlight: [c.A.id],
      book: { card, stage: 'riddle', drumUntil: 0 },
    },
    effects: [{ t: 'book', cardId: card.id, source: card.source, target: card.target }],
    decks: s.decks,
    book: fallback ? { ...s.book, fallback } : undefined,
  };
}

/* ---------- acties ---------- */

export function buildBookQueue(s: GameState): string[] {
  return shuffle(s.submissions.filter((x) => !s.book.usedIds.includes(x.id)).map((x) => x.id));
}

export function canStart(s: GameState) {
  return activePlayers(s).length >= 3;
}

export function startRound1(s: GameState, now: number): GameState {
  if (s.phase !== 'lobby' || !canStart(s)) return s;
  const young = s.players.find((p) => p.id === s.youngestId && !p.paused);
  const first = young ?? activePlayers(s)[0];
  return bump(s, {
    phase: 'round1', direction: 1, locks: [], mijter: null, turnCount: 0, decks: {}, r3: null, banner: null,
    book: { queue: shuffle(s.submissions.map((x) => x.id)), usedIds: [], lastTargets: [], fallback: { queue: [], last: null } },
    turn: { activeId: first.id, stage: 'ready', die: null, rollMs: ROLL_MS, revealAt: 0, pending: null, task: null, resolvedAt: 0, timerEndsAt: null, timerStartsAt: null, timerDone: false, deadline: null, startedAt: now },
  }, 'start');
}

export function roll(s: GameState, now: number, forceDie?: number): GameState {
  const t = s.turn;
  if ((s.phase !== 'round1' && s.phase !== 'round2' && s.phase !== 'round3') || !t || t.stage !== 'ready') return s;
  const die = forceDie ?? 1 + randInt(6);
  const built = s.phase === 'round1' ? buildRound1(s, die, t.activeId) : s.phase === 'round2' ? buildRound2(s, die, t.activeId) : buildRound3(s, die, t.activeId);
  const rollMs = inTurbo(s, now) ? ROLL_TURBO_MS : ROLL_MS;
  const turn: Turn = { ...t, stage: 'rolling', die, rollMs, revealAt: now + rollMs, pending: { task: built.task, effects: built.effects }, task: null, timerEndsAt: null, timerStartsAt: null, timerDone: false, deadline: null };
  return bump(s, { turn, decks: built.decks, book: built.book ?? s.book }, 'dice');
}

function applyEffects(s: GameState, effects: Effect[]): GameState {
  let players = s.players, locks = s.locks, mijter = s.mijter, direction = s.direction, book = s.book;
  for (const e of effects) {
    if (e.t === 'lock') {
      locks = [...locks.filter((x) => x !== e.id), e.id];
      const max = maxLocks(s);
      while (locks.length > max) locks = locks.slice(1);
    } else if (e.t === 'clearLocks') locks = [];
    else if (e.t === 'mijter') mijter = e.id;
    else if (e.t === 'reverse') direction = direction === 1 ? -1 : 1;
    else if (e.t === 'swap') {
      const ia = players.findIndex((p) => p.id === e.a), ib = players.findIndex((p) => p.id === e.b);
      if (ia >= 0 && ib >= 0) {
        players = players.slice();
        [players[ia], players[ib]] = [players[ib], players[ia]];
        // het slotje blijft bij het cadeau op de stoel
        locks = locks.map((x) => (x === e.a ? e.b : x === e.b ? e.a : x));
      }
    } else if (e.t === 'book') {
      if (e.source === 'submission') {
        book = { ...book, usedIds: [...book.usedIds, e.cardId], queue: book.queue.filter((x) => x !== e.cardId), lastTargets: [...book.lastTargets, e.target ?? ''].slice(-2) };
      } else book = { ...book, lastTargets: [...book.lastTargets, ''].slice(-2) };
    }
  }
  return { ...s, players, locks, mijter, direction, book };
}

const FX_FOR: Partial<Record<TaskKind, FxName>> = { chaos: 'tension', book: 'drum', chairs: 'swap', vault: 'lock', mijter: 'mijter', shift: 'shift', reverse: 'reverse' };

function resolveRoll(s: GameState, now: number): GameState {
  const t = s.turn!;
  const p = t.pending!;
  const task: Task = p.task.book ? { ...p.task, book: { ...p.task.book, drumUntil: now + DRUM_MS } } : p.task;
  const s2 = applyEffects(s, p.effects);
  const turn: Turn = { ...t, stage: 'task', pending: null, task, resolvedAt: now, timerEndsAt: null, timerStartsAt: null, timerDone: false };
  return bump(s2, { turn }, FX_FOR[task.kind] ?? 'reveal');
}

/** Host klikt "Onthul de schuldige". */
export function revealBook(s: GameState, now: number): GameState {
  const t = s.turn;
  const b = t?.task?.book;
  if (!t || !t.task || !b || b.stage !== 'riddle' || now < b.drumUntil) return s;
  const c = seatContext(s, t.activeId);
  const card = b.card;
  let reveal: Rich, targetId: string | null = null;
  let arrow = t.task.arrow;
  if (card.source === 'builtin') reveal = rich(BOOK_FALLBACK_REVEAL, { A: c.A.id });
  else if (card.target === GENERAL_TARGET) {
    arrow = rand() < 0.5 ? 'cw' : 'ccw';
    reveal = rich(`Het ging over IEDEREEN! 🎉 Alle spelers geven hun cadeau door ${dirText(arrow === 'cw' ? 1 : -1)}!`);
  } else {
    const T = s.players.find((p) => !p.paused && p.name.toLowerCase() === (card.target ?? '').toLowerCase());
    if (!T) reveal = rich(`Het ging over ${clean(card.target ?? '?')}, maar die zit er vanavond niet bij! {A} mag zelf iemand kiezen die het mooiste cadeau moet afstaan.`, { A: c.A.id });
    else {
      targetId = T.id;
      const safe = s.locks.includes(T.id) ? ' (Het cadeau op slot 🔒 blijft veilig.)' : '';
      reveal = T.id === c.A.id
        ? rich(`Het was {A} zelf! 😱 {A} staat het mooiste cadeau af aan {L} (links van je)!${safe}`, { A: c.A.id, L: c.L.id })
        : rich(`Het was {T}! {T} moet nu het mooiste cadeau afstaan aan {A}!${safe}`, { T: T.id, A: c.A.id });
    }
  }
  const task: Task = { ...t.task, arrow, highlight: targetId ? [targetId, c.A.id] : [c.A.id], book: { ...b, stage: 'revealed', reveal, targetId } };
  return bump(s, { turn: { ...t, task } }, 'bookreveal');
}

export const COUNTDOWN_MS = 3000;

/** Host tikt "Start klok": eerst "Klaar? 3... 2... 1... GO!", daarna loopt de timer van de opdracht. */
export function startTimer(s: GameState, now: number): GameState {
  const t = s.turn;
  if (!t || t.stage !== 'task' || !t.task?.timerSec || t.timerEndsAt) return s;
  return bump(s, { turn: { ...t, timerStartsAt: now + COUNTDOWN_MS, timerEndsAt: now + COUNTDOWN_MS + t.task.timerSec * 1000 } }, 'next');
}

export function canNext(s: GameState, now: number): boolean {
  const t = s.turn;
  if (!t || t.stage !== 'task' || !t.task) return false;
  if (now - t.resolvedAt < NEXT_LOCKOUT_MS) return false;
  if (t.task.book && t.task.book.stage !== 'revealed') return false;
  return true;
}

export function next(s: GameState, now: number): GameState {
  if (!canNext(s, now) || !s.turn) return s;
  const id = nextActiveId(s, s.turn.activeId);
  const turn: Turn = {
    ...s.turn, activeId: id, stage: 'ready', die: null, task: null, pending: null, timerEndsAt: null, timerStartsAt: null, timerDone: false,
    resolvedAt: 0, startedAt: now, deadline: inTension(s, now) ? now + TURN_LIMIT_MS : null,
  };
  return bump(s, { turn, turnCount: s.turnCount + 1 }, 'next');
}

/** Einde Ronde 1 (stapel leeg) -> Ronde 2: uitpakken & kijken, geen tijdslimiet. */
export function startRound2(s: GameState, now: number): GameState {
  if (s.phase !== 'round1' || !s.turn || s.turn.stage === 'rolling') return s;
  const activeId = s.turn.stage === 'task' ? nextActiveId(s, s.turn.activeId, 1) : s.turn.activeId;
  const turn: Turn = { ...s.turn, activeId, stage: 'ready', die: null, task: null, pending: null, timerEndsAt: null, timerStartsAt: null, timerDone: false, resolvedAt: 0, startedAt: now, deadline: null };
  return bump(s, { phase: 'round2', turn, banner: { text: 'RONDE 2: PAK ALLE CADEAUS UIT!', until: now + 5000 } }, 'round2');
}

export function setYoungest(s: GameState, id: string | null): GameState {
  if (s.phase !== 'lobby') return s;
  const next = s.youngestId === id ? null : id;
  return bump(s, { youngestId: next });
}

export function startRound3(s: GameState, now: number): GameState {
  if (s.phase !== 'round2' || !s.turn || s.turn.stage === 'rolling') return s;
  const nominal = s.settings.r3Minutes * 60_000;
  const endAt = now + Math.round(nominal * (0.87 + rand() * 0.26)); // geheim: ±13% rond de ingestelde tijd
  const falseAlarmAt = Math.max(now + 45_000, endAt - (50_000 + randInt(50_000)));
  const activeId = s.turn.stage === 'task' ? nextActiveId(s, s.turn.activeId, 1) : s.turn.activeId;
  const r3 = { startAt: now, endAt, falseAlarmAt: Math.min(falseAlarmAt, endAt - 20_000), falseAlarmDone: false, tensionStarted: false };
  const s2: GameState = { ...s, phase: 'round3', direction: 1, r3 };
  const turn: Turn = { ...s.turn, activeId, stage: 'ready', die: null, task: null, pending: null, timerEndsAt: null, timerStartsAt: null, timerDone: false, resolvedAt: 0, startedAt: now, deadline: inTension(s2, now) ? now + TURN_LIMIT_MS : null };
  return bump(s2, { turn, banner: { text: 'RONDE 3: DE GROTE FINALE!', until: now + 5000 } }, 'round2');
}

export function resetToLobby(s: GameState): GameState {
  return bump(s, {
    phase: 'lobby', turn: null, locks: [], mijter: null, direction: 1, r3: null, banner: null, decks: {}, turnCount: 0,
    book: { queue: [], usedIds: [], lastTargets: [], fallback: { queue: [], last: null } },
  });
}

/** Wordt elke ~250ms door de controller aangeroepen: tijd-gestuurde overgangen. */
export function tick(s: GameState, now: number): GameState {
  let cur = s;
  if (cur.banner && now > cur.banner.until) cur = bump(cur, { banner: null });
  if (cur.phase === 'round3' && cur.r3) {
    const r3 = cur.r3;
    if (now >= r3.endAt) return bump(cur, { phase: 'finished', turn: cur.turn ? { ...cur.turn, stage: 'ready', pending: null, deadline: null, task: null } : null, banner: null }, 'horn');
    if (!r3.tensionStarted && now >= r3.endAt - TENSION_MS) {
      cur = bump(cur, { r3: { ...r3, tensionStarted: true }, turn: cur.turn && cur.turn.stage === 'ready' ? { ...cur.turn, deadline: now + TURN_LIMIT_MS } : cur.turn }, 'tension');
    } else if (!r3.falseAlarmDone && now >= r3.falseAlarmAt) {
      cur = bump(cur, { r3: { ...r3, falseAlarmDone: true }, banner: { text: 'TUUUT! Vals alarm van Piet! 😜 Nog even doorspelen...', until: now + 5000 } }, 'falseAlarm');
    }
  }
  const t = cur.turn;
  if (t && (cur.phase === 'round1' || cur.phase === 'round2' || cur.phase === 'round3')) {
    if (t.stage === 'rolling' && t.pending && now >= t.revealAt) cur = resolveRoll(cur, now);
    else if (t.stage === 'task' && t.timerEndsAt && !t.timerDone && now >= t.timerEndsAt) cur = bump(cur, { turn: { ...t, timerDone: true } }, 'timerEnd');
    else if (t.stage === 'ready' && t.deadline && now >= t.deadline) {
      cur = roll(cur, now);
      cur = { ...cur, banner: { text: 'Schiet op, Piet! De tijd is om, de dobbelsteen rolt vanzelf!', until: now + 3000 } };
    }
  }
  return cur;
}

/* ---------- spelers & instellingen ---------- */

export function setSettings(s: GameState, patch: Partial<GameState['settings']>): GameState {
  return bump(s, { settings: { ...s.settings, ...patch } });
}

export function setPaused(s: GameState, id: string, paused: boolean): GameState {
  const p = playerById(s, id);
  if (!p || p.paused === paused) return s;
  if (paused && activePlayers(s).length <= 1) return s;
  const players = s.players.map((x) => (x.id === id ? { ...x, paused } : x));
  let s2 = bump(s, { players });
  if (paused && s2.turn && s2.turn.activeId === id && s2.turn.stage === 'ready') {
    s2 = { ...s2, turn: { ...s2.turn, activeId: nextActiveId(s2, id) } };
  }
  return s2;
}

export function movePlayer(s: GameState, from: number, to: number): GameState {
  if (from === to || from < 0 || to < 0 || from >= s.players.length || to >= s.players.length) return s;
  const players = s.players.slice();
  const [p] = players.splice(from, 1);
  players.splice(to, 0, p);
  return bump(s, { players });
}

export function addPlayer(s: GameState, rawName: string): GameState {
  const name = clean(rawName.trim().replace(/\s+/g, ' ')).slice(0, 24);
  if (!name || s.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) return s;
  return bump(s, { players: [...s.players, makePlayer(name, s.players.length, s.players)] });
}

export function removePlayer(s: GameState, id: string): GameState {
  if (s.phase !== 'lobby') return s;
  return bump(s, { players: s.players.filter((p) => p.id !== id), locks: s.locks.filter((x) => x !== id), mijter: s.mijter === id ? null : s.mijter });
}

/* ---------- inzendingen ---------- */

export function mergeSubmissions(s: GameState, incoming: Submission[]): GameState {
  const have = new Set(s.submissions.map((x) => x.id));
  const fresh = incoming.filter((x) => !have.has(x.id) && !s.removedIds.includes(x.id));
  if (!fresh.length) return s;
  const queue = s.phase === 'lobby' ? s.book.queue : [...s.book.queue, ...fresh.map((x) => x.id)];
  return bump(s, { submissions: [...s.submissions, ...fresh], book: { ...s.book, queue }, loadedAt: Date.now() });
}

export function removeSubmission(s: GameState, id: string): GameState {
  return bump(s, {
    submissions: s.submissions.filter((x) => x.id !== id), removedIds: [...s.removedIds, id],
    book: { ...s.book, queue: s.book.queue.filter((x) => x !== id) },
  });
}

/* ---------- laden/opslaan ---------- */

export function isValidState(x: any): x is GameState {
  return !!x && x.v === 2 && Array.isArray(x.players) && Array.isArray(x.submissions) && typeof x.phase === 'string';
}

export type { Phase, Audience };
