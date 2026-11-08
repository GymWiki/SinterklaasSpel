'use client';
import { useEffect, useState } from 'react';
import { Ring } from './Ring';
import { Dice } from './Dice';
import { RichText } from './Rich';
import { PlayersPanel } from './PlayersPanel';
import { canNext, inTension, next, nextActiveId, playerById, resetToLobby, revealBook, roll, startRound2, startRound3, startTimer, COUNTDOWN_MS } from '@/game/engine';
import type { GameState } from '@/game/types';

type Upd = (fn: (s: GameState, now: number) => GameState) => void;

export function Controller({ state: s, update, now }: { state: GameState; update: Upd; now: number }) {
  const [armed, setArmed] = useState<'' | 'r2' | 'r3' | 'reset'>('');
  const [panel, setPanel] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(''), 4000);
    return () => clearTimeout(id);
  }, [armed]);

  const t = s.turn;
  const active = t ? playerById(s, t.activeId) : undefined;
  const task = t?.task ?? null;
  const rolling = t?.stage === 'rolling' && now < t.revealAt;
  const nextP = t ? playerById(s, nextActiveId(s, t.activeId)) : undefined;
  const nextOk = canNext(s, now);
  const book = task?.book;
  const drum = !!book && now < book.drumUntil;
  const deadlineLeft = t?.stage === 'ready' && t.deadline ? Math.max(0, Math.ceil((t.deadline - now) / 1000)) : null;

  if (s.phase === 'finished') {
    return (
      <div className="stack">
        <section className="card stop-card">
          <div className="stop-ic">🚢</div>
          <h1>STOP! Handen af van de cadeaus!</h1>
          <p>De stoomboot is aangekomen. Het spel is afgelopen. Fijne pakjesavond!</p>
          <button className={`btn big ${armed === 'reset' ? 'danger' : 'primary'}`} onClick={() => (armed === 'reset' ? (setArmed(''), update(resetToLobby)) : setArmed('reset'))}>
            {armed === 'reset' ? 'Zeker weten? Tik nogmaals' : '↩️ Terug naar de lobby (nieuw spel)'}
          </button>
        </section>
      </div>
    );
  }

  if (!t || !active) return null;
  return (
    <div className="stack">
      <section className={`card turn-card ${inTension(s, now) ? 'tension' : ''}`} style={{ ['--c' as any]: active.color }}>
        <div className="turn-top">
          <span className="chip">{s.phase === 'round1' ? 'Ronde 1 · Verdelen' : s.phase === 'round2' ? 'Ronde 2 · Uitpakken' : 'Ronde 3 · Finale'}</span>
          <span className="chip">{s.direction === 1 ? '↻ met de klok mee' : '↺ tegen de klok in'}</span>
          {s.phase === 'round3' && <span className="chip">🔒 {s.locks.length}{s.mijter ? ' · 🛡️' : ''}</span>}
        </div>

        {t.stage === 'ready' && (
          <>
            <button className="btn roll" onClick={() => update(roll)}>
              <span className="roll-ic">🎲</span>
              Gooi Dobbelsteen voor <b style={{ color: active.color }}>{active.name}</b>
            </button>
            {deadlineLeft !== null && <div className={`piet ${deadlineLeft <= 5 ? 'urgent' : ''}`}>⏱️ Schiet op, Piet! Nog {deadlineLeft}s</div>}
          </>
        )}

        {t.stage === 'rolling' && (
          <div className="rolling-box">
            <Dice value={t.die} rolling={rolling} ms={t.rollMs} />
            <button className="btn roll" disabled>🎲 De dobbelsteen rolt...</button>
          </div>
        )}

        {t.stage === 'task' && task && (
          <>
            <div className="task-card">
              <div className="task-tag">{task.emoji} {task.title}</div>
              <div className="task-main"><RichText rich={book ? task.main : task.main} players={s.players} /></div>
              {book && !drum && <blockquote className="quote">{book.card.type === 'dilemma' ? book.card.content : `“${book.card.content}”`}</blockquote>}
              {book && drum && <p className="hint">🥁 Tromgeroffel...</p>}
              {task.sub && <div className="task-sub"><RichText rich={task.sub} players={s.players} /></div>}
              {book?.stage === 'revealed' && book.reveal && <div className="reveal"><RichText rich={book.reveal} players={s.players} /></div>}
              {task.foot && <div className="task-sub">{task.foot}</div>}
              {task.timerSec && t.timerStartsAt && now < t.timerStartsAt && <div className="timer-sm">Klaar? {Math.ceil((t.timerStartsAt - now) / 1000)}...</div>}
              {task.timerSec && !t.timerDone && t.timerStartsAt && now >= t.timerStartsAt && t.timerEndsAt && <div className="timer-sm">⏱️ {Math.max(0, Math.ceil((t.timerEndsAt - now) / 1000))}s</div>}
              {t.timerDone && task.timerSec && <div className="timer-sm">⏰ Tijd is om!</div>}
            </div>

            {task.timerSec && !t.timerEndsAt && (
              <button className="btn clock-btn" onClick={() => update(startTimer)}>▶️ Start klok ({task.timerSec}s)<small>Eerst rustig lezen, dan 3-2-1-GO!</small></button>
            )}
            {book && book.stage === 'riddle' && (
              <button className="btn reveal-btn" disabled={drum} onClick={() => update(revealBook)}>👀 Onthul de schuldige</button>
            )}
            <button className="btn next-btn" disabled={!nextOk} onClick={() => update(next)}>
              {nextOk ? <>Volgende Speler ➡️ <b>{nextP?.name}</b></> : book && book.stage === 'riddle' ? 'Eerst de schuldige onthullen...' : 'Even wachten...'}
            </button>
          </>
        )}
      </section>

      {s.phase === 'round1' && (
        <section className="card">
          <button
            className={`btn big ${armed === 'r2' ? 'danger' : 'ghost'}`}
            disabled={t.stage === 'rolling'}
            onClick={() => (armed === 'r2' ? (setArmed(''), update(startRound2)) : setArmed('r2'))}
          >
            {armed === 'r2' ? 'Zeker weten? Tik nogmaals!' : 'Stapel is leeg → Start Ronde 2 (Uitpakken)'}
          </button>
        </section>
      )}

      {s.phase === 'round2' && (
        <section className="card">
          <button
            className={`btn big ${armed === 'r3' ? 'danger' : 'ghost'}`}
            disabled={t.stage === 'rolling'}
            onClick={() => (armed === 'r3' ? (setArmed(''), update(startRound3)) : setArmed('r3'))}
          >
            {armed === 'r3' ? 'Zeker weten? Tik nogmaals om de finale te starten!' : 'Alles is uitgepakt → Start De Finale (Ronde 3)'}
          </button>
        </section>
      )}

      <section className="card">
        <div className="ring-prev"><Ring mini players={s.players} activeId={t.activeId} locks={s.locks} mijter={s.mijter} highlight={task?.highlight ?? []} direction={s.direction} /></div>
        <button className="btn ghost" onClick={() => setPanel((p) => !p)}>{panel ? 'Verberg spelers' : '👥 Spelers & volgorde'}</button>
        {panel && <PlayersPanel state={s} update={update} />}
        <a className="linkbtn" href={`/tv/${s.roomId}`} target="_blank" rel="noreferrer">📺 TV-scherm openen</a>
      </section>
    </div>
  );
}
