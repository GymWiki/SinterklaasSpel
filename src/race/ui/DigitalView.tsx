'use client';
import { useEffect, useState } from 'react';
import { Confetti } from '@/components/Confetti';
import { AWARDS } from '../common';
import * as D from '../digital';
import { timeLeftAny, type RaceGame } from '../store';
import { BigTimer, QuestionCard, RaceDice, RaceLegend } from './shared';

type Act = (fn: (g: RaceGame, now: number) => RaceGame, undoable?: boolean) => void;
const asD = (fn: (s: D.Digital, now: number) => D.Digital) => (g: RaceGame, now: number) => (g.kind === 'digital' ? fn(g, now) : g);

const LEGEND = ['Pak 1 uit het midden', 'Pak 1 uit het midden', 'Pak van een team met meer pakjes', 'Schudpiet: iedereen 1 naar links', 'Pak 2 uit het midden', 'Sinterklaas: ruil je stapel'];

export function TeamsStrip({ g }: { g: D.Digital }) {
  return (
    <div className="r-strip">
      {g.teams.map((t) => (
        <div key={t.id} className={`r-team ${g.roller === t.id ? 'active' : ''}`} style={{ ['--c' as any]: t.color }}>
          <b>{t.name}</b>
          <span className="r-gifts" aria-label={`${t.pakjes.length} pakjes`}>{'🎁'.repeat(t.pakjes.length)}</span>
        </div>
      ))}
    </div>
  );
}

/** Pakjes van één team uitpakken: trommelroffel, daarna elk pakje onthullen met een lopende teller. */
function Unwrap({ team }: { team: D.Team }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    team.pakjes.forEach((_, i) => timers.push(setTimeout(() => setShown(i + 1), 2800 + i * 900)));
    return () => timers.forEach(clearTimeout);
  }, [team.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const running = team.pakjes.slice(0, shown).reduce((a, p) => a + p.v, 0);
  return (
    <div className="r-unwrap" style={{ ['--c' as any]: team.color }}>
      <h2>{team.name}</h2>
      <div className="r-pakjes">
        {team.pakjes.map((p, i) => (
          <div key={p.id} className={`r-pakje ${i < shown ? 'open' : ''} ${p.v === 8 ? 'gold' : p.v === 0 ? 'pech' : ''}`}>
            {i < shown ? (p.v === 0 ? <><span>💥</span><small>Pietenpech!</small></> : p.v === 8 ? <><span>🌟</span><small>GOUD 8</small></> : <><span>{'🍪'.repeat(p.v)}</span><small>{p.v}</small></>) : <span>🎁</span>}
          </div>
        ))}
      </div>
      <div className="r-count">🍪 {running} {shown < team.pakjes.length ? '...' : 'pepernoten'}</div>
    </div>
  );
}

export function DigitalView({ g, act, now }: { g: D.Digital; act: Act; now: number }) {
  const roller = g.roller ? D.teamById(g, g.roller) : null;
  const left = timeLeftAny(g, now);

  if (g.phase === 'question' || g.phase === 'answer') {
    const answer = g.phase === 'answer';
    return (
      <div className="r-main r-split">
        <div className="r-col">
          <div className="r-kicker">Ronde {g.round} van {g.rounds} · Pietenvraag</div>
          <QuestionCard q={g.question} showAnswer={answer} />
        </div>
        <div className="r-col r-side">
          {!answer ? (
            <BigTimer leftMs={left} totalMs={g.timer.totalMs} paused={g.timer.paused} />
          ) : (
            <>
              <div className="r-kicker">Welke teams hadden het goed?</div>
              <div className="r-picks">
                {g.teams.map((t) => (
                  <button key={t.id} className={`r-pick ${g.correct.includes(t.id) ? 'on' : ''}`} style={{ ['--c' as any]: t.color }} onClick={() => act(asD((s) => D.toggleCorrect(s, t.id)), false)}>
                    <span className="r-check">{g.correct.includes(t.id) ? '✅' : '⬜'}</span>{t.name}
                  </button>
                ))}
              </div>
              <p className="r-hint">Goede teams dobbelen. Foute teams krijgen een troostpakje.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (g.phase === 'rolling' || g.phase === 'choose') {
    return (
      <div className="r-main r-rollgrid">
        <RaceLegend rows={LEGEND} die={g.rollPending ? null : g.die} />
        <div className="r-col r-center">
          {roller && <div className="r-roller" style={{ ['--c' as any]: roller.color }}>{roller.name} dobbelt!</div>}
          <RaceDice die={g.die} rolling={g.rollPending} />
          {g.message && <div className="r-msg">{g.message}</div>}
          {g.phase === 'choose' && g.choose && (
            <div className="r-picks r-choose">
              {g.choose.options.map((id) => {
                const t = D.teamById(g, id);
                return (
                  <button key={id} className="r-pick" style={{ ['--c' as any]: t.color }} onClick={() => act(asD((s) => D.chooseTeam(s, id)))}>
                    {t.name} <small>({t.pakjes.length} 🎁)</small>
                  </button>
                );
              })}
              {g.choose.kind === 'swap' && <button className="r-pick ghost" onClick={() => act(asD((s) => D.skipSwap(s)))}>Niet ruilen</button>}
            </div>
          )}
        </div>
        <div className="r-col r-queue">
          <div className="r-kicker">Aan de beurt</div>
          {g.queue.map((id, i) => (
            <div key={id} className={`r-qrow ${i === 0 ? 'now' : ''}`} style={{ ['--c' as any]: D.teamById(g, id).color }}>{D.teamById(g, id).name}</div>
          ))}
        </div>
      </div>
    );
  }

  if (g.phase === 'scoreboard') {
    return (
      <div className="r-main r-center">
        <div className="r-kicker">Stand na ronde {g.round} van {g.rounds}</div>
        {g.message && <div className="r-msg">{g.message}</div>}
        <div className="r-board">
          {g.teams.map((t) => (
            <div key={t.id} className="r-boardrow" style={{ ['--c' as any]: t.color }}>
              <b>{t.name}</b>
              <span>{'🎁'.repeat(t.pakjes.length)}</span>
              <em>{t.pakjes.length}</em>
            </div>
          ))}
        </div>
        <p className="r-hint">Wat er in de pakjes zit? Dat blijft een verrassing tot de finale!</p>
      </div>
    );
  }

  if (g.phase === 'finale') {
    const order = D.finaleOrder(g);
    const shownIds = order.slice(0, g.finaleRevealed);
    const latest = shownIds.length ? D.teamById(g, shownIds[shownIds.length - 1]) : null;
    return (
      <div className="r-main r-center">
        <div className="r-kicker">🥁 De finale: uitpakken!</div>
        {!latest ? (
          <div className="r-big">Druk op de spatiebalk om het eerste team uit te pakken!</div>
        ) : (
          <Unwrap key={latest.id} team={latest} />
        )}
        <div className="r-done-row">
          {shownIds.slice(0, -1).map((id) => {
            const t = D.totals(g).find((x) => x.id === id)!;
            return <div key={id} className="r-chip" style={{ ['--c' as any]: t.color }}>{t.name}: 🍪 {t.total}</div>;
          })}
        </div>
      </div>
    );
  }

  // awards + done
  const tot = D.totals(g).slice().sort((a, b) => b.total - a.total);
  const win = D.winners(g);
  return (
    <div className="r-main r-center">
      <Confetti count={g.phase === 'done' ? 120 : 200} />
      <div className="r-kicker">{win.length > 1 ? '🏆 Gelijkspel: allebei winnaar!' : '🏆 De winnaar is...'}</div>
      <div className="r-board">
        {tot.map((t) => (
          <div key={t.id} className={`r-boardrow ${win.includes(t.id) ? 'winner' : ''}`} style={{ ['--c' as any]: t.color }}>
            <b>{win.includes(t.id) ? '🏆 ' : ''}{t.name}</b>
            <span>🍪 {t.total}</span>
            {g.phase === 'awards' ? (
              <select className="r-award" value={g.awards[t.id] ?? ''} onChange={(e) => act(asD((s) => D.setAward(s, t.id, e.target.value || null)), false)} aria-label={`Prijs voor ${t.name}`}>
                <option value="">Bijzondere prijs...</option>
                {AWARDS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            ) : (
              <em className="r-award-tag">{g.awards[t.id] ?? ''}</em>
            )}
          </div>
        ))}
      </div>
      {g.phase === 'done' && <div className="r-big">Fijne pakjesavond! 🎅</div>}
    </div>
  );
}
