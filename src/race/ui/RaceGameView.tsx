'use client';
import { useEffect, useState } from 'react';
import { sfx } from '@/game/sound';
import { useNow, useWakeLock } from '@/game/store';
import { addTimeAny, primaryAny, skipQuestionAny, togglePauseAny, type RaceGame, type useRace } from '../store';
import { DigitalView, TeamsStrip } from './DigitalView';
import { RealView } from './RealView';
import { useRaceSound } from './useRaceSound';

type Race = ReturnType<typeof useRace>;

/** Tekst op de grote knop onderaan = wat de spatiebalk nu doet. */
export function primaryLabel(g: RaceGame): { text: string; disabled: boolean } {
  if (g.kind === 'digital') {
    switch (g.phase) {
      case 'question': return { text: 'Toon het antwoord', disabled: false };
      case 'answer': return { text: g.correct.length ? 'Goede teams gaan dobbelen' : 'Niemand goed: troostpakjes', disabled: false };
      case 'rolling': return g.rollPending ? { text: 'Dobbelen...', disabled: true } : g.rollDone ? { text: 'Volgende', disabled: false } : { text: '🎲 Gooi de dobbelsteen!', disabled: false };
      case 'choose': return { text: 'Kies een team op het scherm', disabled: true };
      case 'scoreboard': return { text: g.round >= g.rounds ? 'Naar de finale!' : 'Volgende ronde', disabled: false };
      case 'finale': return { text: g.finaleRevealed === 0 ? '🥁 Start het uitpakken!' : 'Volgend team uitpakken', disabled: false };
      case 'awards': return { text: 'Afsluiten', disabled: false };
      default: return { text: '', disabled: true };
    }
  }
  switch (g.phase) {
    case 'ready': return { text: '🎲 Gooi de dobbelsteen!', disabled: false };
    case 'rolling': return { text: 'Dobbelen...', disabled: true };
    case 'result': return { text: g.result?.die === 5 ? 'Start de Pietenvraag' : 'Verder', disabled: false };
    case 'question': return { text: 'Toon het antwoord', disabled: false };
    case 'answer': return { text: 'Verder', disabled: false };
    case 'finaleCountdown': return { text: 'Aftellen...', disabled: true };
    case 'finale': return { text: 'Afsluiten', disabled: false };
    default: return { text: '', disabled: true };
  }
}

export function RaceGameView({ race, game }: { race: Race; game: RaceGame }) {
  const now = useNow(200);
  useWakeLock(true);
  useRaceSound(game, now);
  const [muted, setMuted] = useState(false);
  const [fs, setFs] = useState(false);
  const { act, undo, reset, canUndo } = race;

  // bediening met de toetsenbord: spatie = volgende, U = terug, P = pauze, + = 15 sec, N = vraag overslaan
  useEffect(() => {
    const isField = (t: EventTarget | null) => t instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
    const down = (e: KeyboardEvent) => {
      sfx.unlock();
      if (isField(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.code === 'Space') {
        e.preventDefault();
        (document.activeElement as HTMLElement | null)?.blur?.();
        if (!e.repeat) act(primaryAny);
      } else if (e.key === 'u' || e.key === 'U') undo();
      else if (e.key === 'p' || e.key === 'P') act(togglePauseAny, false);
      else if (e.key === '+' || e.key === '=') act(addTimeAny, false);
      else if (e.key === 'n' || e.key === 'N') act(skipQuestionAny);
    };
    const up = (e: KeyboardEvent) => e.code === 'Space' && !isField(e.target) && e.preventDefault();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('pointerdown', () => sfx.unlock(), { once: true });
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [act, undo]);

  useEffect(() => {
    const on = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);

  const p = primaryLabel(game);
  const inQuestion = game.phase === 'question';
  const finished = game.phase === 'done' || (game.kind === 'real' && game.phase === 'finale');
  const roundInfo = game.kind === 'digital' ? `Ronde ${game.round}/${game.rounds}` : `Ronde ${game.round}/${game.rounds}`;
  const showStrip = game.kind === 'digital' && !['finale', 'awards', 'done'].includes(game.phase);

  return (
    <div className="race">
      <header className="race-top">
        <div className="race-title">🎅 De Pietenpakjes-race</div>
        <div className="race-mode">{game.kind === 'digital' ? '💻 Digitaal' : '🎁 Echte pakjes'} · {roundInfo}</div>
      </header>

      {game.kind === 'digital' ? <DigitalView g={game} act={act} now={now} /> : <RealView g={game} now={now} />}

      {showStrip && game.kind === 'digital' && <TeamsStrip g={game} />}

      <footer className="race-bar">
        <div className="race-tools">
          <button className="rt" disabled={!canUndo} onClick={undo} title="Laatste actie terugdraaien (U)">↩ Terug</button>
          {inQuestion && (
            <>
              <button className="rt" onClick={() => act(togglePauseAny, false)} title="Pauze (P)">{game.timer.paused ? '▶ Doorgaan' : '⏸ Pauze'}</button>
              <button className="rt" onClick={() => act(addTimeAny, false)} title="15 seconden erbij (+)">⏱ +15 sec</button>
              <button className="rt" onClick={() => act(skipQuestionAny)} title="Vraag overslaan (N)">⏭ Andere vraag</button>
            </>
          )}
          <span className="race-grow" />
          <button className="rt" onClick={() => { setMuted(!muted); sfx.setMuted(!muted); }}>{muted ? '🔇 Geluid uit' : '🔊 Geluid aan'}</button>
          <button className="rt" onClick={() => (fs ? document.exitFullscreen?.() : document.documentElement.requestFullscreen?.().catch(() => {}))}>{fs ? '🗗 Venster' : '⛶ Volledig scherm'}</button>
          <button className="rt danger" onClick={() => { if (window.confirm('Het spel stoppen? De stand gaat verloren.')) reset(); }}>⏹ Stoppen</button>
        </div>
        {finished ? (
          <button className="race-next" onClick={() => reset()}>🔁 Nieuw spel</button>
        ) : (
          <button className="race-next" disabled={p.disabled} onClick={() => act(primaryAny)}>
            {p.disabled && <span className="spin" />}{p.text}<small>spatiebalk</small>
          </button>
        )}
      </footer>
    </div>
  );
}
