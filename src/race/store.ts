'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as D from './digital';
import * as R from './real';

export type RaceGame = D.Digital | R.Real;
interface Snap { game: RaceGame; at: number }
interface Saved { game: RaceGame | null; history: Snap[] }

export const RACE_KEY = 'pietenrace:v1';
const MAX_HISTORY = 40;

export const tickAny = (g: RaceGame, now: number): RaceGame => (g.kind === 'digital' ? D.tick(g, now) : R.tick(g, now));
export const primaryAny = (g: RaceGame, now: number): RaceGame => (g.kind === 'digital' ? D.primary(g, now) : R.primary(g, now));
export const togglePauseAny = (g: RaceGame, now: number): RaceGame => (g.kind === 'digital' ? D.togglePause(g, now) : R.togglePause(g, now));
export const addTimeAny = (g: RaceGame, now: number): RaceGame => (g.kind === 'digital' ? D.addTime(g, now) : R.addTime(g, now));
export const skipQuestionAny = (g: RaceGame, now: number): RaceGame => (g.kind === 'digital' ? D.skipQuestion(g, now) : R.skipQuestion(g, now));
export const timeLeftAny = (g: RaceGame, now: number) => (g.kind === 'digital' ? D.timeLeftMs(g, now) : R.timeLeftMs(g, now));

/** Na "terugdraaien" staat een lopende vraag-timer stil (op de resterende tijd van toen), zodat er geen tijd verloren gaat. */
export function freezeTimer(g: RaceGame, at: number): RaceGame {
  if (g.phase !== 'question' || g.timer.paused || g.timer.endsAt === null) return g;
  return { ...g, timer: { ...g.timer, paused: true, remainingMs: Math.max(0, g.timer.endsAt - at), endsAt: null } } as RaceGame;
}

function load(): Saved {
  try {
    const raw = localStorage.getItem(RACE_KEY);
    if (!raw) return { game: null, history: [] };
    const s = JSON.parse(raw);
    if (s?.game?.v === 1 && (s.game.kind === 'digital' || s.game.kind === 'real')) return { game: s.game, history: Array.isArray(s.history) ? s.history : [] };
  } catch {}
  return { game: null, history: [] };
}

/** Spelstand + undo-geschiedenis in localStorage: een refresh raakt het spel niet kwijt. */
export function useRace() {
  const [saved, setSaved] = useState<Saved | null>(null);
  const ref = useRef<Saved>({ game: null, history: [] });

  const commit = useCallback((n: Saved) => {
    ref.current = n;
    setSaved(n);
    try {
      localStorage.setItem(RACE_KEY, JSON.stringify(n));
    } catch {}
  }, []);

  useEffect(() => {
    const l = load();
    ref.current = l;
    setSaved(l);
  }, []);

  /** Voer een engine-functie uit. `undoable` = komt in de terugdraai-lijst. */
  const act = useCallback((fn: (g: RaceGame, now: number) => RaceGame, undoable = true) => {
    const cur = ref.current;
    if (!cur.game) return;
    const now = Date.now();
    const next = fn(cur.game, now);
    if (next === cur.game) return;
    commit({ game: next, history: undoable ? [...cur.history.slice(-(MAX_HISTORY - 1)), { game: cur.game, at: now }] : cur.history });
  }, [commit]);

  const start = useCallback((g: RaceGame) => commit({ game: g, history: [] }), [commit]);
  const reset = useCallback(() => {
    commit({ game: null, history: [] });
  }, [commit]);
  const undo = useCallback(() => {
    const cur = ref.current;
    const last = cur.history[cur.history.length - 1];
    if (!last) return;
    commit({ game: freezeTimer(last.game, last.at), history: cur.history.slice(0, -1) });
  }, [commit]);

  // klok van de engines (dobbel-animatie afronden, finale-aftelling)
  const live = !!saved?.game;
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => act(tickAny, false), 250);
    return () => clearInterval(id);
  }, [live, act]);

  return { game: saved?.game ?? null, loaded: saved !== null, canUndo: (saved?.history.length ?? 0) > 0, act, start, reset, undo };
}
