'use client';
import { useState } from 'react';
import { addPlayer, movePlayer, removePlayer, setPaused, setYoungest } from '@/game/engine';
import type { GameState } from '@/game/types';

type Upd = (fn: (s: GameState, now: number) => GameState) => void;

/** Zitkring beheren: slepen (of ▲▼), pauzeren, toevoegen, verwijderen (alleen in de lobby). */
export function PlayersPanel({ state: s, update }: { state: GameState; update: Upd }) {
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [name, setName] = useState('');
  const lobby = s.phase === 'lobby';
  const n = s.players.length;

  return (
    <div className="players-panel">
      <ol className="plist">
        {s.players.map((p, i) => (
          <li
            key={p.id}
            draggable
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => { e.preventDefault(); setOver(i); }}
            onDragEnd={() => { setDrag(null); setOver(null); }}
            onDrop={() => { if (drag !== null) update((st) => movePlayer(st, drag, i)); setDrag(null); setOver(null); }}
            className={`${over === i && drag !== null ? 'over' : ''} ${p.paused ? 'paused' : ''}`}
          >
            <span className="grip" aria-hidden>⠿</span>
            <span className="pn">{i + 1}</span>
            <span className="pic">{p.icon}</span>
            <span className="pname" style={{ color: p.color }}>{p.name}{i === 0 && <small> (host, 6 uur)</small>}{s.youngestId === p.id && <small> 🍼 jongste, begint</small>}</span>
            <span className="pbtns">
              {lobby && <button className={`btn small ${s.youngestId === p.id ? 'gold' : 'ghost'}`} onClick={() => update((st) => setYoungest(st, p.id))} title="Jongste speler: begint met dobbelen" aria-pressed={s.youngestId === p.id}>🍼</button>}
              <button className="btn small ghost" disabled={i === 0} onClick={() => update((st) => movePlayer(st, i, i - 1))} aria-label={`${p.name} omhoog`}>▲</button>
              <button className="btn small ghost" disabled={i === n - 1} onClick={() => update((st) => movePlayer(st, i, i + 1))} aria-label={`${p.name} omlaag`}>▼</button>
              <button className={`btn small ${p.paused ? 'warn' : 'ghost'}`} onClick={() => update((st) => setPaused(st, p.id, !p.paused))} title="Pauze (even naar de wc)">{p.paused ? '▶️' : '⏸️'}</button>
              {lobby && n > 3 && <button className="btn small ghost" onClick={() => update((st) => removePlayer(st, p.id))} aria-label={`${p.name} verwijderen`}>✕</button>}
            </span>
          </li>
        ))}
      </ol>
      <form className="row" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { update((st) => addPlayer(st, name)); setName(''); } }}>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nieuwe speler toevoegen" maxLength={24} />
        <button className="btn">＋</button>
      </form>
      {lobby && <p className="hint">🍼 Tik op de jongste speler: die begint met dobbelen in Ronde 1{s.youngestId ? '' : ' (nu nog niet gekozen: de host begint)'}.</p>}
      <p className="hint">Volgorde = met de klok mee, beginnend bij de host onderaan (6 uur). ⏸️ = tijdelijk overslaan.</p>
    </div>
  );
}
