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
  const fs = n <= 5 ? 6.2 : n <= 7 ? 5.4 : n <= 9 ? 4.6 : n <= 12 ? 4 : 3.4;
  const rx = 39, ry = n > 9 ? 40 : 38;
  const dir = arrow ? (arrow === 'cw' ? 1 : -1) : direction;
  return (
    <div className={`ring ${mini ? 'mini' : ''}`} style={{ ['--fs' as any]: fs } as CSSProperties}>
      <svg className={`ring-line ${arrow ? 'bold' : ''} ${dir === 1 ? 'cw' : 'ccw'}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <ellipse cx="50" cy="50" rx={rx} ry={ry} pathLength={100} />
      </svg>
      {players.map((p, i) => {
        const th = ((90 + (i * 360) / n) * Math.PI) / 180;
        const x = 50 + rx * Math.cos(th);
        const y = 50 + ry * Math.sin(th);
        const cls = ['seat', p.id === activeId && 'active', highlight.includes(p.id) && 'hl', p.id === targetId && 'target', p.paused && 'paused'].filter(Boolean).join(' ');
        return (
          <div key={p.id} className={cls} style={{ left: `${x}%`, top: `${y}%`, ['--c' as any]: p.color }}>
            <span className="seat-ic">{p.icon}</span>
            <span className="seat-nm">{p.name}</span>
            {(locks.includes(p.id) || mijter === p.id || p.paused) && (
              <span className="seat-badges">
                {locks.includes(p.id) && <span className="pill lock"><span>🔒</span>{!mini && <b>Kluis</b>}</span>}
                {mijter === p.id && <span className="pill shield"><span>🛡️</span>{!mini && <b>Mijter</b>}</span>}
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
