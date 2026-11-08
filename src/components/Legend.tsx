import type { Phase } from '@/game/types';

/** Dobbelsteen-Legenda: wat betekent 1 t/m 6 in de huidige ronde? (max. 3-4 woorden per regel) */
export const LEGEND: Record<'round1' | 'round2' | 'round3', { title: string; rows: string[] }> = {
  round1: {
    title: 'Ronde 1 · Verdelen',
    rows: ['Pak van stapel (dicht laten!)', 'Alles 1 plek naar links ⬅️', 'Steel een cadeau', 'Alles 1 plek naar rechts ➡️', 'Geef aan wie het minste heeft', 'Pak van stapel & pak uit! 🎉'],
  },
  round2: {
    title: 'Ronde 2 · Uitpakken',
    rows: ['Pak 1 cadeau uit! 🎁', 'Ruil met linker- of rechterbuur', 'Ruil met de overkant', 'Huiskamer-Opdracht! ⏱️', 'Pak van wie het meeste heeft', 'Pak 1 cadeau uit! 🎁'],
  },
  round3: {
    title: 'Ronde 3 · De Finale',
    rows: ['Steel een cadeau! 🕵️', 'Groeps-schuif (met pijl mee) 🔄', 'Win De Kluis 🔒 of Mijter 🛡️', 'Huiskamer-Duel! ⚔️', 'Draai richting om & buren-ruil 🔁', 'CHAOS VAN PIET! ⚡'],
  },
};

const DICE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export function Legend({ phase, die }: { phase: Phase; die: number | null }) {
  if (phase !== 'round1' && phase !== 'round2' && phase !== 'round3') return null;
  const l = LEGEND[phase];
  return (
    <aside className="legend" aria-label="Dobbelsteen-legenda">
      <div className="legend-title">{l.title}</div>
      <ol>
        {l.rows.map((text, i) => (
          <li key={i} className={die === i + 1 ? 'on' : ''}>
            <span className="ld">{DICE[i]}</span>
            <span className="lt">{text}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
