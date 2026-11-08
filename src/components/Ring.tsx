import type { CSSProperties, ReactNode } from 'react';
import type { Player } from '@/game/types';

interface Props {
  players: Player[];
  activeId?: string | null;
  locks?: string[];
  mijter?: string | null;
  highlight?: string[];
  targetId?: string | null;
  direction?: 1 | -1;
  arrow?: 'cw' | 'ccw';
  mini?: boolean;
  children?: ReactNode;
}

/**
 * Bovenaanzicht van de woonkamer. players[0] zit onderaan (6 uur), de rest met de klok mee.
 * Elke speler heeft een stabiele key, zodat een stoelendans live wegglijdt via een CSS-transition.
 */
export function Ring({ players, activeId, locks = [], mijter, highlight = [], targetId, direction = 1, arrow, mini, children }: Props) {
  const n = Math.max(players.length, 1);
  const dense = n > 14; // klassikaal: twee kringen (buiten + binnen), kleinere chips
  const fs = dense ? (n <= 24 ? 2.9 : n <= 36 ? 2.5 : 2.2) : n <= 5 ? 6.2 : n <= 7 ? 5.4 : n <= 9 ? 4.6 : n <= 12 ? 4 : 3.4;
  const rx = dense ? 42 : 39, ry = dense ? 41 : n > 9 ? 40 : 38;
  const outerN = dense ? Math.ceil(n * 0.6) : n; // de rest zit in de binnenkring
  const innerN = n - outerN;
  const irx = 29, iry = 28;
  const dir = arrow ? (arrow === 'cw' ? 1 : -1) : direction;
  const pos = (i: number) => {
    if (i < outerN) {
      const th = ((90 + (i * 360) / outerN) * Math.PI) / 180;
      return { x: 50 + rx * Math.cos(th), y: 50 + ry * Math.sin(th) };
    }
    const j = i - outerN;
    const th = ((90 + (j * 360) / Math.max(innerN, 1)) * Math.PI) / 180;
    return { x: 50 + irx * Math.cos(th), y: 50 + iry * Math.sin(th) };
  };
  return (
    <div className={`ring ${mini ? 'mini' : ''} ${dense ? 'dense' : ''}`} style={{ ['--fs' as any]: fs } as CSSProperties}>
      <svg className={`ring-line ${arrow ? 'bold' : ''} ${dir === 1 ? 'cw' : 'ccw'}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <ellipse cx="50" cy="50" rx={rx} ry={ry} pathLength={100} />
        {dense && <ellipse cx="50" cy="50" rx={irx} ry={iry} pathLength={100} />}
      </svg>
      {players.map((p, i) => {
        const { x, y } = pos(i);
        const cls = ['seat', p.id === activeId && 'active', highlight.includes(p.id) && 'hl', p.id === targetId && 'target', p.paused && 'paused'].filter(Boolean).join(' ');
        return (
          <div key={p.id} className={cls} style={{ left: `${x}%`, top: `${y}%`, ['--c' as any]: p.color }}>
            {!dense && <span className="seat-ic">{p.icon}</span>}
            <span className="seat-nm">{p.name}</span>
            {(locks.includes(p.id) || mijter === p.id || p.paused) && (
              <span className="seat-badges">
                {locks.includes(p.id) && <span className="pill lock"><span>🔒</span>{!mini && !dense && <b>Kluis</b>}</span>}
                {mijter === p.id && <span className="pill shield"><span>🛡️</span>{!mini && !dense && <b>Mijter</b>}</span>}
                {p.paused && <span className="pill zz"><span>💤</span></span>}
              </span>
            )}
          </div>
        );
      })}
      <div className="ring-center">{children}</div>
      {arrow && <div className="ring-arrow">{arrow === 'cw' ? '↻' : '↺'}</div>}
    </div>
  );
}
