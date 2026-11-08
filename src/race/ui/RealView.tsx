'use client';
import { Confetti } from '@/components/Confetti';
import * as R from '../real';
import { timeLeftAny, type RaceGame } from '../store';
import { BigTimer, QuestionCard, RaceDice, RaceLegend } from './shared';

const LEGEND = ['Iedereen 1 plek naar links ⬅️', 'Iedereen 1 plek naar rechts ➡️', 'Ruil met de overbuur ↔️', 'Kleurenpiet: kleur ruilt met buur 🎨', 'Pietenvraag: goed = ruilen ❓', 'Sinterklaas: 3 kinderen ruilen met iedereen 🎅'];

function Pairs({ g, pairs, unpaired, compact }: { g: R.Real; pairs: [string, string][]; unpaired?: string[]; compact?: boolean }) {
  const size = (pairs.length <= 3 ? 5.2 : pairs.length <= 8 ? 3.8 : pairs.length <= 14 ? 3 : 2.4) * (compact ? 0.72 : 1);
  return (
    <div className="r-pairs" style={{ fontSize: `${size}vmin`, columnCount: pairs.length > 14 ? 3 : pairs.length > 6 ? 2 : 1 }}>
      {pairs.map(([a, b]) => (
        <div key={a + b} className="r-pair"><b>{R.kidName(g, a)}</b> <span>↔</span> <b>{R.kidName(g, b)}</b></div>
      ))}
      {!!unpaired?.length && <div className="r-pair r-unpaired">{unpaired.map((id) => R.kidName(g, id)).join(', ')}: houdt dit keer het eigen pakje</div>}
    </div>
  );
}

export function RealView({ g, now }: { g: R.Real; now: number }) {
  const left = timeLeftAny(g, now);

  if (g.phase === 'ready' || g.phase === 'rolling') {
    return (
      <div className="r-main r-rollgrid r-rollgrid2">
        <RaceLegend rows={LEGEND} die={null} />
        <div className="r-col r-center">
          <div className="r-kicker">Ronde {g.round} van {g.rounds}</div>
          <RaceDice die={g.die} rolling={g.rollPending} />
          <div className="r-big">{g.phase === 'ready' ? 'Druk op de spatiebalk om te dobbelen!' : 'De dobbelsteen rolt...'}</div>
        </div>
      </div>
    );
  }

  if (g.phase === 'result' && g.result) {
    const r = g.result;
    const compact = (r.die === 4 && (r.pairs?.length ?? 0) > 0) || (r.pairs?.length ?? 0) > 4;
    return (
      <div className="r-main r-rollgrid r-rollgrid2">
        <RaceLegend rows={LEGEND} die={r.die} />
        <div className={`r-col r-center ${compact ? 'r-compact' : ''}`}>
          <div className="r-kicker">Ronde {g.round} van {g.rounds} · {r.title}</div>
          {r.arrow && <div className={`r-arrow ${r.arrow}`}>{r.arrow === 'left' ? '⬅️' : '➡️'}</div>}
          {r.color && <div className="r-colorpiet" style={{ background: r.color.hex }}><b>{r.color.name.toUpperCase()}</b></div>}
          <div className="r-resulttext">{r.text}</div>
          {r.chosen && <div className="r-chosen">{r.chosen.map((id) => <span key={id} className="r-name">{R.kidName(g, id)}</span>)}</div>}
          {r.pairs && r.pairs.length > 0 && <Pairs g={g} pairs={r.pairs} unpaired={r.unpaired} compact={compact} />}
          {r.die === 4 && r.wearers && r.wearers.length === 0 && <p className="r-hint">Kijk goed: wie draagt deze kleur? Die ruilt met de buurman!</p>}
        </div>
      </div>
    );
  }

  if (g.phase === 'question' || g.phase === 'answer') {
    const answer = g.phase === 'answer';
    return (
      <div className="r-main r-split">
        <div className="r-col">
          <div className="r-kicker">Pietenvraag voor:</div>
          <div className="r-chosen">{g.questionKids.map((id) => <span key={id} className="r-name">{R.kidName(g, id)}</span>)}</div>
          {g.question && <QuestionCard q={g.question} showAnswer={answer} />}
        </div>
        <div className="r-col r-side">
          {answer ? <div className="r-big">Wie goed antwoordt, mag met een kind naar keuze ruilen!</div> : <BigTimer leftMs={left} totalMs={g.timer.totalMs} paused={g.timer.paused} />}
        </div>
      </div>
    );
  }

  if (g.phase === 'finaleCountdown') {
    return (
      <div className="r-main r-center">
        <div className="r-kicker">De finale! Houd je pakje goed vast...</div>
        <div className="r-countdown" key={g.countdown}>{g.countdown}</div>
      </div>
    );
  }

  return (
    <div className="r-main r-center">
      <Confetti count={220} />
      <div className="r-final">🎁 Het pakje dat je nu vasthoudt is van jou! 🎉</div>
      {g.phase === 'done' && <div className="r-big">Fijne pakjesavond! 🎅</div>}
    </div>
  );
}
