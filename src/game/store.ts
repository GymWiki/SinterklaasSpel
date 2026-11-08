'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isValidState, tick } from './engine';
import type { GameState } from './types';

export const storageKey = (id: string) => `pakjesavond:v1:${id}`;
export const pinKey = (id: string) => `pakjesavond:pin:${id}`;
const chanName = (id: string) => `pakjesavond-${id}`;

export function loadLocal(id: string): GameState | null {
  try {
    const raw = localStorage.getItem(storageKey(id));
    if (!raw) return null;
    const s = JSON.parse(raw);
    return isValidState(s) ? s : null;
  } catch {
    return null;
  }
}
export function saveLocal(s: GameState) {
  try {
    localStorage.setItem(storageKey(s.roomId), JSON.stringify(s));
  } catch {
    /* vol of geblokkeerd: spel loopt in het geheugen verder */
  }
}
export function clearLocal(id: string) {
  try {
    localStorage.removeItem(storageKey(id));
  } catch {}
}

/**
 * Controller-state (host). Bron van waarheid = localStorage; elke wijziging wordt ook via BroadcastChannel
 * naar het TV-scherm gestuurd (en het TV-scherm valt terug op het `storage`-event). Geen netwerk nodig.
 */
export function useHostGame(roomId: string) {
  const [state, setState] = useState<GameState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<GameState | null>(null);
  const chan = useRef<BroadcastChannel | null>(null);
  const tvSeen = useRef(0);

  const commit = useCallback((n: GameState) => {
    ref.current = n;
    setState(n);
    saveLocal(n);
    chan.current?.postMessage({ type: 'state', state: n });
  }, []);

  useEffect(() => {
    const s = loadLocal(roomId);
    ref.current = s;
    setState(s);
    setLoaded(true);
    try {
      chan.current = new BroadcastChannel(chanName(roomId));
      chan.current.onmessage = (e) => {
        const m = e.data;
        if (m?.type === 'tv-alive') tvSeen.current = Date.now();
        if (m?.type === 'hello' && ref.current) chan.current?.postMessage({ type: 'state', state: ref.current });
      };
    } catch {
      chan.current = null;
    }
    return () => chan.current?.close();
  }, [roomId]);

  /** Pas een pure engine-functie toe op de laatste state. */
  const update = useCallback((fn: (s: GameState, now: number) => GameState) => {
    const cur = ref.current;
    if (!cur) return;
    const n = fn(cur, Date.now());
    if (n !== cur) commit(n);
  }, [commit]);

  const replace = useCallback((n: GameState) => commit(n), [commit]);

  // klok van de GameEngine: tijd-gestuurde overgangen (rollen afronden, timers, einde ronde 2, ...)
  useEffect(() => {
    if (!state) return;
    const id = setInterval(() => update(tick), 250);
    return () => clearInterval(id);
  }, [!!state, update]); // eslint-disable-line react-hooks/exhaustive-deps

  const tvAlive = useCallback(() => Date.now() - tvSeen.current < 6000, []);
  return { state, loaded, update, replace, tvAlive };
}

/** TV-scherm: leest alleen mee. */
export function useTvGame(roomId: string) {
  const [state, setState] = useState<GameState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const rev = useRef(-1);

  useEffect(() => {
    const accept = (s: GameState | null) => {
      if (!s || !isValidState(s)) return;
      if (s.rev >= rev.current || s.phase === 'lobby') {
        rev.current = s.rev;
        setState(s);
      }
    };
    accept(loadLocal(roomId));
    setLoaded(true);
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel(chanName(roomId));
      ch.onmessage = (e) => e.data?.type === 'state' && accept(e.data.state);
      ch.postMessage({ type: 'hello' });
    } catch {}
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey(roomId)) accept(loadLocal(roomId));
    };
    window.addEventListener('storage', onStorage);
    const beat = setInterval(() => ch?.postMessage({ type: 'tv-alive' }), 2000);
    ch?.postMessage({ type: 'tv-alive' });
    const poll = setInterval(() => accept(loadLocal(roomId)), 1500); // vangnet
    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(beat);
      clearInterval(poll);
      ch?.close();
    };
  }, [roomId]);

  return { state, loaded };
}

export function useNow(ms = 250) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/** Screen Wake Lock: schermen blijven aan tijdens het uitpakken. */
export function useWakeLock(active = true) {
  useEffect(() => {
    if (!active) return;
    let lock: any = null;
    let stopped = false;
    const acquire = async () => {
      try {
        const nav: any = navigator;
        if (nav.wakeLock && document.visibilityState === 'visible') {
          lock = await nav.wakeLock.request('screen');
          if (stopped) lock.release?.();
        }
      } catch {}
    };
    acquire();
    const onVis = () => document.visibilityState === 'visible' && acquire();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      stopped = true;
      document.removeEventListener('visibilitychange', onVis);
      lock?.release?.().catch?.(() => {});
    };
  }, [active]);
}
