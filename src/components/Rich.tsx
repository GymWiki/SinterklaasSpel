import type { Player, Rich } from '@/game/types';

/** Rendert een tekst met {A}/{L}/... tokens als gekleurde spelersnamen. */
export function RichText({ rich, players }: { rich: Rich; players: Player[] }) {
  const parts = rich.tpl.split(/(\{[A-Z]+\})/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = /^\{([A-Z]+)\}$/.exec(part);
        if (!m) return <span key={i}>{part}</span>;
        const p = players.find((x) => x.id === rich.slots[m[1]]);
        if (!p) return null;
        return (
          <b key={i} className="nm" style={{ color: p.color }}>
            {p.name}
          </b>
        );
      })}
    </>
  );
}
