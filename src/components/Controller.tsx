'use client';
import { useEffect, useState } from 'react';
import { Ring } from './Ring';
import { Dice } from './Dice';
import { RichText } from './Rich';
import { PlayersPanel } from './PlayersPanel';
import { canNext, inTension, next, nextActiveId, playerById, resetToLobby, revealBook, roll, setPaused, startRound2, startRound3, startTimer, stopTimer } from '@/game/engine';
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

  const READY_LOCK_MS = 1200; // anti-vingerdikte: na "Volgende" is de gooi-knop heel even op slot
  const readyLock = t.stage === 'ready' && now - t.startedAt < READY_LOCK_MS;
  const timerRunning = !!(task?.timerSec && t.timerEndsAt && !t.timerDone);
  const timerPending = !!(task?.timerSec && !t.timerEndsAt);
  const roundLabel = s.phase === 'round1' ? 'Ronde 1 · Verdelen' : s.phase === 'round2' ? 'Ronde 2 · Uitpakken' : 'Ronde 3 · Finale';

  return (
    <div className="stack has-dock">
      <section className={`card hud ${inTension(s, now) ? 'tension' : ''}`} style={{ ['--c' as any]: active.color }}>
        <div className="turn-top">
          <span className="chip">{roundLabel}</span>
          <span className="chip">{s.direction === 1 ? '↻ met de klok mee' : '↺ tegen de klok in'}</span>
          {s.phase === 'round3' && <span className="chip">🔒 {s.locks.length}{s.mijter ? ' · 🛡️' : ''}</span>}
        </div>
        <div className="hud-who">
          <span className="hud-ic">{active.icon}</span>
          <div>
            <small>Aan de beurt</small>
            <b style={{ color: active.color }}>{active.name}</b>
          </div>
        </div>
        {deadlineLeft !== null && <div className={`piet ${deadlineLeft <= 5 ? 'urgent' : ''}`}>⏱️ Schiet op, Piet! Nog {deadlineLeft}s</div>}
        {t.stage === 'ready' && (
          <button className="btn small ghost hud-pause" onClick={() => update((st) => setPaused(st, active.id, true))}>⏸️ {active.name} even pauzeren (wc)</button>
        )}
      </section>

      {t.stage === 'rolling' && (
        <section className="card rolling-box">
          <Dice value={t.die} rolling={rolling} ms={t.rollMs} />
        </section>
      )}

      {t.stage === 'task' && task && (
        <section className="card task-card">
          <div className="task-tag">{task.emoji} {task.title}</div>
          <div className="task-main"><RichText rich={task.main} players={s.players} /></div>
          {book && !drum && <blockquote className="quote">{book.card.type === 'dilemma' ? book.card.content : `“${book.card.content}”`}</blockquote>}
          {book && drum && <p className="hint">🥁 Tromgeroffel...</p>}
          {task.sub && <div className="task-sub"><RichText rich={task.sub} players={s.players} /></div>}
          {task.foot && <div className="task-sub">{task.foot}</div>}
          {book?.stage === 'revealed' && book.reveal && <div className="reveal"><RichText rich={book.reveal} players={s.players} /></div>}
          {task.timerSec && t.timerStartsAt && now < t.timerStartsAt && <div className="timer-sm">Klaar? {Math.ceil((t.timerStartsAt - now) / 1000)}...</div>}
          {timerRunning && t.timerStartsAt && now >= t.timerStartsAt && t.timerEndsAt && <div className="timer-sm">⏱️ {Math.max(0, Math.ceil((t.timerEndsAt - now) / 1000))}s</div>}
          {t.timerDone && task.timerSec && <div className="timer-sm">⏰ Tijd is om!</div>}
        </section>
      )}

      {s.phase === 'round1' && (
        <section className="card">
          <button className={`btn big ${armed === 'r2' ? 'danger' : 'ghost'}`} disabled={t.stage === 'rolling'} onClick={() => (armed === 'r2' ? (setArmed(''), update(startRound2)) : setArmed('r2'))}>
            {armed === 'r2' ? 'Zeker weten? Tik nogmaals!' : 'Stapel is leeg → Start Ronde 2 (Uitpakken)'}
          </button>
        </section>
      )}

      {s.phase === 'round2' && (
        <section className="card">
          <button className={`btn big ${armed === 'r3' ? 'danger' : 'ghost'}`} disabled={t.stage === 'rolling'} onClick={() => (armed === 'r3' ? (setArmed(''), update(startRound3)) : setArmed('r3'))}>
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

      {/* Één-duims bediening: de primaire actie zit altijd vast onderaan */}
      <div className="dock">
        {t.stage === 'task' && timerPending && (
          <button className="btn clock-btn" onClick={() => update(startTimer)}>▶️ Start klok ({task!.timerSec}s)<small>Eerst rustig lezen, dan 3-2-1-GO!</small></button>
        )}
        {t.stage === 'task' && timerRunning && (
          <button className="btn clock-stop" onClick={() => update(stopTimer)}>⏹ Stop klok</button>
        )}
        {t.stage === 'task' && book && book.stage === 'riddle' && (
          <button className="btn reveal-btn" disabled={drum} onClick={() => update(revealBook)}>👀 Onthul de schuldige</button>
        )}

        {t.stage === 'ready' && (
          <button className="btn primary-act roll-act" disabled={readyLock} onClick={() => update(roll)}>
            {readyLock ? <><span className="spin" /> Even wachten...</> : <><span className="act-ic">🎲</span> GOOI VOOR <b>{active.name.toUpperCase()}</b></>}
          </button>
        )}
        {t.stage === 'rolling' && (
          <button className="btn primary-act roll-act" disabled><span className="spin" /> Dobbelen...</button>
        )}
        {t.stage === 'task' && (
          <button className="btn primary-act next-act" disabled={!nextOk} onClick={() => update(next)}>
            {nextOk ? <>VOLGENDE SPELER ➡️ <b>{nextP?.name.toUpperCase()}</b></> : <><span className="spin" /> {book && book.stage === 'riddle' ? 'Eerst onthullen...' : 'Even wachten...'}</>}
          </button>
        )}
      </div>
    </div>
  );
}
