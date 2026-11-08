'use client';
import { useEffect, useState } from 'react';

const PIPS: Record<number, number[]> = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};

export function Dice({ value, rolling, ms = 1800, idle }: { value: number | null; rolling: boolean; ms?: number; idle?: boolean }) {
  const [face, setFace] = useState(value ?? 6);
  useEffect(() => {
    if (!rolling) {
      if (value) setFace(value);
      return;
    }
    const id = setInterval(() => setFace(1 + Math.floor(Math.random() * 6)), ms < 1000 ? 55 : 85);
    return () => clearInterval(id);
  }, [rolling, value, ms]);

  const shown = rolling ? face : value ?? null;
  return (
    <div className={`dice ${rolling ? 'rolling' : ''} ${idle && !rolling && !value ? 'idle' : ''}`} style={{ ['--ms' as any]: `${ms}ms` }} aria-label={shown ? `Dobbelsteen: ${shown}` : 'Dobbelsteen'}>
      {shown ? (
        <div className="dice-face">
          {Array.from({ length: 9 }, (_, i) => (
            <i key={i} className={PIPS[shown].includes(i) ? 'pip' : ''} />
          ))}
        </div>
      ) : (
        <div className="dice-face q">?</div>
      )}
    </div>
  );
}
