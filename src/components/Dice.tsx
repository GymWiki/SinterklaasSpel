'use client';
import { useEffect, useState } from 'react';

const PIPS: Record<number, number[]> = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};

/** Welke rotatie (graden) brengt welke zijde naar voren? Overstaande zijden tellen op tot 7. */
const ORIENT: Record<number, [number, number]> = {
  1: [0, 0], 6: [0, 180], 2: [0, -90], 5: [0, 90], 3: [-90, 0], 4: [90, 0],
};
const FACES: { v: number; t: string }[] = [
  { v: 1, t: 'rotateY(0deg)' },
  { v: 6, t: 'rotateY(180deg)' },
  { v: 2, t: 'rotateY(90deg)' },
  { v: 5, t: 'rotateY(-90deg)' },
  { v: 3, t: 'rotateX(90deg)' },
  { v: 4, t: 'rotateX(-90deg)' },
];

/**
 * Echte 3D-dobbelsteen (CSS 3D). De uitkomst staat al vast zodra er gegooid wordt, dus de rol-animatie
 * tuimelt precies naar de juiste zijde en blijft daar liggen. Bij het stilvallen volgt een "klap".
 */
export function Dice({ value, rolling, ms = 1800, idle }: { value: number | null; rolling: boolean; ms?: number; idle?: boolean }) {
  const [land, setLand] = useState(false);
  const target = value ?? 1;
  const [fx, fy] = ORIENT[target];

  useEffect(() => {
    if (rolling || !value) return;
    setLand(true);
    const id = setTimeout(() => setLand(false), 900);
    return () => clearTimeout(id);
  }, [rolling, value]);

  const state = rolling ? 'roll' : value ? 'rest' : 'idle';
  return (
    <div className={`dice3d ${land ? 'land' : ''} ${idle ? 'idle' : ''}`} style={{ ['--fx' as any]: `${fx}deg`, ['--fy' as any]: `${fy}deg`, ['--ms' as any]: `${ms}ms` }} aria-label={value ? `Dobbelsteen: ${value}` : 'Dobbelsteen'}>
      <div className="shadow" />
      <div className={`cube ${state}`}>
        {FACES.map((f) => (
          <div key={f.v} className="face" style={{ transform: `${f.t} translateZ(calc(var(--s) / 2))` }}>
            {Array.from({ length: 9 }, (_, i) => (
              <i key={i} className={PIPS[f.v].includes(i) ? 'pip' : ''} />
            ))}
          </div>
        ))}
      </div>
      {land && <div className="shock" />}
    </div>
  );
}
