'use client';
import { useEffect, useRef } from 'react';
import { sfx } from '@/game/sound';
import { timeLeftAny, type RaceGame } from '../store';

/** Geluiden voor de race: dobbelrol met klap, tikklok in de laatste seconden, trommelroffel en fanfare in de finale. */
export function useRaceSound(g: RaceGame | null, now: number) {
  const prev = useRef<RaceGame | null>(null);
  const lastSec = useRef<number | null>(null);
  const endedFor = useRef<string>('');

  useEffect(() => {
    const p = prev.current;
    prev.current = g;
    if (!g || !p || p === g) return;
    if (g.rollPending && !p.rollPending) sfx.play('dice');
    if (g.phase !== p.phase) {
      if (g.phase === 'answer') sfx.play('reveal');
      if (g.phase === 'choose') sfx.play('lock');
      if (g.phase === 'scoreboard') sfx.play('next');
      if (g.phase === 'finale' && p.phase !== 'finale') {
        sfx.play('drum');
        setTimeout(() => sfx.play('bookreveal'), 2800);
      }
      if (g.phase === 'awards') sfx.play('horn');
    }
    if (g.kind === 'digital' && p.kind === 'digital' && g.phase === 'finale' && g.finaleRevealed > p.finaleRevealed) {
      sfx.play('drum');
      setTimeout(() => sfx.play('reveal'), 2800);
    }
    if (g.kind === 'real' && p.kind === 'real') {
      if (g.phase === 'finaleCountdown' && g.countdown !== p.countdown) sfx.tick(g.countdown, true);
      if (g.phase === 'finale' && p.phase !== 'finale') {
        sfx.play('drum');
        setTimeout(() => sfx.play('finale'), 2800);
      }
    }
  }, [g]);

  // tikkende klok in de laatste 10 seconden van een vraag
  useEffect(() => {
    if (!g || g.phase !== 'question' || g.timer.paused) {
      lastSec.current = null;
      return;
    }
    const sec = Math.ceil(timeLeftAny(g, now) / 1000);
    const key = g.question && 'id' in g.question ? (g.question as { id: string }).id : '';
    if (sec <= 0) {
      if (endedFor.current !== key) { endedFor.current = key; sfx.play('timerEnd'); }
      return;
    }
    if (sec <= 10 && lastSec.current !== sec) {
      lastSec.current = sec;
      sfx.tick(sec);
    }
  }, [g, now]);
}
