'use client';
import { Dice } from '@/components/Dice';
import { Q_LABEL, type Question } from '../common';
import { ROLL_MS } from '../common';

/** Cirkel-countdown: groen -> oranje -> knipperend rood (zelfde look als het dobbelspel). */
export function BigTimer({ leftMs, totalMs, paused }: { leftMs: number; totalMs: number; paused?: boolean }) {
  const f = Math.max(0, Math.min(1, leftMs / Math.max(1, totalMs)));
  const tone = f > 0.5 ? 'tone-ok' : f > 0.25 ? 'tone-warn' : 'tone-hot';
  const sec = Math.ceil(leftMs / 1000);
  return (
    <div className={`timer big ${leftMs <= 0 ? 'tone-hot' : tone} ${paused ? 'paused' : ''}`} aria-label={`Nog ${sec} seconden`}>
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="44" className="t-bg" />
        <circle cx="50" cy="50" r="44" className="t-fg" pathLength={100} strokeDasharray="100" strokeDashoffset={100 - f * 100} />
      </svg>
      <span>{paused ? '⏸' : sec}</span>
    </div>
  );
}

export function QuestionCard({ q, showAnswer }: { q: Question; showAnswer?: boolean }) {
  return (
    <div className="r-q">
      <div className="r-q-type">{Q_LABEL[q.type]}</div>
      <div className="r-q-text">{q.tekst}</div>
      {showAnswer && (
        <div className="r-q-answer">
          <small>Antwoord</small>
          <b>{q.antwoord ?? 'De klas beslist!'}</b>
        </div>
      )}
    </div>
  );
}

/** Eén gedeelde dobbelsteen voor beide modi (3D-animatie + geluid via useRaceSound). */
export function RaceDice({ die, rolling }: { die: number | null; rolling: boolean }) {
  return (
    <div className="race-dice">
      <Dice value={die} rolling={rolling} ms={ROLL_MS} idle />
    </div>
  );
}

export const DIE_ICONS = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export function RaceLegend({ rows, die }: { rows: string[]; die: number | null }) {
  return (
    <aside className="legend race-legend" aria-label="Dobbelsteen-legenda">
      <div className="legend-kicker">Wat betekent het getal?</div>
      <ol>
        {rows.map((t, i) => (
          <li key={i} className={die === i + 1 ? 'on' : ''}>
            <span className="ld">{DIE_ICONS[i]}</span>
            <span className="lt">{t}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
