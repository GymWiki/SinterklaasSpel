'use client';
import { useEffect, useState } from 'react';
import { Ring } from './Ring';
import { Dice } from './Dice';
import { RichText } from './Rich';
import { Confetti } from './Confetti';
import { QR } from './QR';
import { FEATURES } from '@/lib/features';
import { inTension, inTurbo, playerById } from '@/game/engine';
import { sfx } from '@/game/sound';
import type { GameState, Task } from '@/game/types';

function Boat({ s, now }: { s: GameState; now: number }) {
  let p = 0;
  if (s.phase === 'round3' && s.r3) {
    const total = s.settings.r3Minutes * 60_000 * 1.14; // nooit de echte eindtijd verklappen
    p = Math.min(0.9, Math.max(0, (now - s.r3.startAt) / total));
  } else if (s.phase === 'finished') p = 1;
  return (
    <div className="boat-track" aria-hidden>
      <div className="waves" />
      <span className="quay">🏠</span>
      <span className="boat" style={{ left: `calc(${p * 84}% + 1vmin)`, transition: s.phase === 'finished' ? 'left 3s ease-in-out' : 'left 1s linear' }}>🚢</span>
    </div>
  );
}

function TimerRing({ left, total }: { left: number; total: number }) {
  const f = Math.max(0, Math.min(1, left / total));
  return (
    <div className={`timer ${left <= 3 ? 'urgent' : ''}`}>
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="44" className="t-bg" />
        <circle cx="50" cy="50" r="44" className="t-fg" pathLength={100} strokeDasharray="100" strokeDashoffset={100 - f * 100} />
      </svg>
      <span>{Math.max(0, Math.ceil(left))}</span>
    </div>
  );
}

function BookOverlay({ s, task, now }: { s: GameState; task: Task; now: number }) {
  const b = task.book!;
  const drum = now < b.drumUntil;
  const card = b.card;
  const long = card.content.length;
  const size = long < 90 ? 4.6 : long < 170 ? 3.8 : long < 260 ? 3.1 : 2.6;
  const target = b.targetId ? playerById(s, b.targetId) : null;
  return (
    <div className="book-overlay">
      {drum ? (
        <div className="drum">
          <div className="drum-ic">🥁</div>
          <div className="drum-tx">Sinterklaas bladert in Het Grote Boek...</div>
        </div>
      ) : (
        <div className="book">
          <div className="book-title">📖 Het Grote Boek van Sinterklaas</div>
          <div className="book-page">
            {card.type !== 'dilemma' && (
              <div className="book-lead">{card.type === 'poem' ? 'Sinterklaas leest een gedicht voor:' : 'Sinterklaas leest voor uit Het Grote Boek:'}</div>
            )}
            <div className="book-text" style={{ fontSize: `${size}vmin` }}>
              {card.type === 'dilemma' ? card.content : `“${card.content}”`}
            </div>
            {b.stage === 'riddle' && card.type !== 'dilemma' && <div className="book-q">{card.type === 'poem' ? 'Over wie gaat dit gedicht?' : 'Over wie in deze kamer gaat dit?'}</div>}
            {b.stage === 'riddle' && card.type === 'dilemma' && <div className="book-q">Denk goed na... Wie is het?</div>}
            {b.stage === 'revealed' && b.reveal && (
              <div className="book-reveal">
                {target && (
                  <div className="big-target" style={{ color: target.color }}>
                    {target.icon} {target.name.toUpperCase()}
                  </div>
                )}
                <div className="reveal-tx">
                  <RichText rich={b.reveal} players={s.players} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function TvScreen({ state: s, now }: { state: GameState; now: number }) {
  const [origin, setOrigin] = useState('');
  const [armed, setArmed] = useState(false);
  const [fs, setFs] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => {
    const on = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);

  const t = s.turn;
  const active = t ? playerById(s, t.activeId) : undefined;
  const task = t?.task ?? null;
  const rolling = t?.stage === 'rolling' && now < t.revealAt;
  const tension = inTension(s, now);
  const turbo = inTurbo(s, now);
  const unlocked = armed || sfx.ready;

  const activate = () => {
    sfx.unlock();
    setArmed(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const deadlineLeft = t?.stage === 'ready' && t.deadline ? (t.deadline - now) / 1000 : null;
  const timerLeft = t?.stage === 'task' && t.timerEndsAt && !t.timerDone ? (t.timerEndsAt - now) / 1000 : null;
  const roundLabel = s.phase === 'round1' ? 'Ronde 1 · Verdelen' : s.phase === 'round2' ? 'Ronde 2 · Uitpakken & Kijken' : s.phase === 'round3' ? (tension ? 'Ronde 3 · De ontknoping!' : 'Ronde 3 · De Grote Finale') : s.phase === 'finished' ? 'Einde!' : 'Pakjesavond Live';

  return (
    <div className={`tv ${tension ? 'tension' : ''} ${turbo ? 'turbo' : ''}`}>
      <header className="tv-top">
        <div className="tv-title">🎅 {roundLabel}</div>
        <Boat s={s} now={now} />
        <div className="tv-status">
          {(s.phase === 'round3' || s.phase === 'finished') && <span title="Slotjes">🔒 {s.locks.length}</span>}
          {s.mijter && <span title="Mijter">🛡️ {playerById(s, s.mijter)?.name}</span>}
          <span>{s.direction === 1 ? '↻' : '↺'}</span>
        </div>
      </header>

      <main className="tv-main">
        <section className="tv-ring">
          <Ring players={s.players} activeId={s.phase === 'lobby' || s.phase === 'finished' ? null : t?.activeId} locks={s.locks} mijter={s.mijter} highlight={task?.highlight ?? []} targetId={task?.book?.targetId} direction={s.direction} arrow={task?.arrow}>
            {s.phase === 'lobby' ? <div className="center-logo">🎁</div> : s.phase === 'finished' ? <div className="center-logo">🚢</div> : <Dice value={t?.die ?? null} rolling={rolling} ms={t?.rollMs} idle />}
          </Ring>
        </section>

        <section className="tv-panel">
          {s.phase === 'lobby' && (
            <div className="panel-lobby">
              <h1>Welkom bij Pakjesavond Live!</h1>
              {FEATURES.book ? <p className="big">Het Grote Boek is geladen met <b>{s.submissions.length}</b> geheimen en gedichten!</p> : <p className="big">{s.players.length ? <><b>{s.players.length}</b> spelers zitten klaar in de kring.</> : 'De host zet de spelers klaar...'}</p>}
              {FEATURES.book && origin && !s.isDemo && (
                <div className="join-qr">
                  <QR text={`${origin}/join/${s.roomId}`} size={190} />
                  <div>
                    <div className="small">Nog iets insturen? Scan de code of ga naar</div>
                    <div className="code">{origin.replace(/^https?:\/\//, '')}/join/{s.roomId}</div>
                  </div>
                </div>
              )}
              <p className="small">De host zet de zitkring klaar en start het spel.</p>
            </div>
          )}

          {(s.phase === 'round1' || s.phase === 'round2' || s.phase === 'round3') && t && active && (
            <div className="panel-turn">
              {s.phase !== 'round3' && <div className="goal">🎯 {s.phase === 'round1' ? 'Ronde 1: verdeel alle cadeaus van de stapel' : 'Ronde 2: Pak alle cadeaus uit!'}</div>}
              <div className="turn-who" style={{ color: active.color }}>
                <span>{active.icon}</span> {active.name}
              </div>
              {t.stage === 'ready' && (
                <>
                  <div className="turn-hint">{tension ? 'Schiet op, Piet! Gooi de dobbelsteen!' : 'is aan de beurt. Gooi de dobbelsteen!'}</div>
                  {deadlineLeft !== null && <TimerRing left={deadlineLeft} total={20} />}
                </>
              )}
              {t.stage === 'rolling' && <div className="turn-hint pulse">De dobbelsteen rolt...</div>}
              {t.stage === 'task' && task && !task.book && (
                <div className="task">
                  <div className="task-tag">{task.emoji} {task.title}</div>
                  <div className="task-main"><RichText rich={task.main} players={s.players} /></div>
                  {task.sub && <div className="task-sub"><RichText rich={task.sub} players={s.players} /></div>}
                  {timerLeft !== null && task.timerSec && <TimerRing left={timerLeft} total={task.timerSec} />}
                  {t.timerDone && task.timerSec && <div className="timeup">⏰ Tijd is om!</div>}
                </div>
              )}
              {t.stage === 'task' && task?.book && <div className="turn-hint">📖 Het Grote Boek is open...</div>}
            </div>
          )}
        </section>
      </main>

      {t?.stage === 'task' && task?.book && s.phase !== 'finished' && <BookOverlay s={s} task={task} now={now} />}

      {s.banner && now <= s.banner.until && <div className="banner">{s.banner.text}</div>}

      {s.phase === 'finished' && (
        <div className="finish">
          <Confetti />
          <div className="finish-box">
            <div className="finish-ic">🚢</div>
            <h1>STOP!</h1>
            <h2>Handen af van de cadeaus!</h2>
          </div>
        </div>
      )}

      {!unlocked && (
        <button className="gate" onClick={activate}>
          <span>🔊 Activeer TV-Scherm &amp; Geluid</span>
          <small>Tik of klik één keer, dan werken alle geluiden en de stoomboothoorn</small>
        </button>
      )}
      {unlocked && !fs && (
        <button className="fs-btn" onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})} title="Volledig scherm">⛶</button>
      )}
    </div>
  );
}
