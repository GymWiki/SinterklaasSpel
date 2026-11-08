'use client';
import { useEffect, useRef } from 'react';
import { inTension } from './engine';
import { sfx, type MusicMode } from './sound';
import type { GameState } from './types';

/**
 * Speelt geluiden af op basis van de state: nieuwe `fx`-events, aftelpiepjes, en achtergrondmuziek.
 * Het TV-scherm gebruikt `enabled=true`; de controller alleen als er geen TV-scherm verbonden is.
 */
export function useSoundDriver(state: GameState | null, now: number, enabled: boolean) {
  const lastFx = useRef<number | null>(null);
  const lastSec = useRef<number | null>(null);

  useEffect(() => {
    if (!state) return;
    const id = state.fx?.id ?? 0;
    if (lastFx.current === null) {
      lastFx.current = id; // geen geluiden herhalen bij herladen
      return;
    }
    if (id > lastFx.current) {
      lastFx.current = id;
      if (enabled && state.fx) sfx.play(state.fx.name);
    }
  }, [state?.fx?.id, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const t = state?.turn;
  let secLeft: number | null = null;
  let urgent = false;
  if (state && t) {
    if (t.stage === 'task' && t.timerEndsAt && !t.timerDone) secLeft = Math.ceil((t.timerEndsAt - now) / 1000);
    else if (t.stage === 'ready' && t.deadline) {
      const s = Math.ceil((t.deadline - now) / 1000);
      if (s <= 5) { secLeft = s; urgent = true; }
    }
  }
  useEffect(() => {
    if (secLeft === null || secLeft < 1) {
      lastSec.current = null;
      return;
    }
    if (lastSec.current !== secLeft) {
      lastSec.current = secLeft;
      if (enabled) sfx.tick(secLeft, urgent);
    }
  }, [secLeft, enabled, urgent]);

  let mode: MusicMode = 'off';
  if (state?.phase === 'round1') mode = 'calm';
  else if (state?.phase === 'unwrap') mode = 'lively';
  else if (state?.phase === 'round2') mode = inTension(state, now) ? 'tense' : 'lively';
  useEffect(() => {
    sfx.setMusic(enabled ? mode : 'off');
  }, [mode, enabled]);
  useEffect(() => () => sfx.setMusic('off'), []);
}
