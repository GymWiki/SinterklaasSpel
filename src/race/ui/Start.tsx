'use client';
import { useMemo, useState } from 'react';
import { LEVELS, TEAM_COLORS, type Level } from '../common';
import { createDigital } from '../digital';
import { createReal, numberedKids } from '../real';
import type { RaceGame } from '../store';

const TEAM_NAMES = ['De Pepernoten', 'De Pietjes', 'De Stoomboten', 'De Mijters', 'De Speculaasjes', 'De Schoorstenen'];

/** Startscherm: modus, niveau, aantal rondes en setup (teams of kinderen). */
export function Start({ onStart }: { onStart: (g: RaceGame) => void }) {
  const [mode, setMode] = useState<'digital' | 'real'>('digital');
  const [level, setLevel] = useState<Level>('g56');
  const [rounds, setRounds] = useState<number | null>(null);
  const [teamCount, setTeamCount] = useState(4);
  const [teams, setTeams] = useState(TEAM_NAMES.map((name, i) => ({ name, color: TEAM_COLORS[i].name })));
  const [byCount, setByCount] = useState(false);
  const [count, setCount] = useState(24);
  const [names, setNames] = useState('');
  const [useColors, setUseColors] = useState(false);
  const [kidColors, setKidColors] = useState<Record<number, string>>({});
  const [err, setErr] = useState('');

  const r = rounds ?? (mode === 'digital' ? 8 : 10);
  const kidNames = useMemo(() => (byCount ? numberedKids(count).map((k) => k.name) : names.split(/\n|,/).map((x) => x.trim()).filter(Boolean)), [byCount, count, names]);

  function go() {
    setErr('');
    const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('seed') : null;
    const seed = q ? Number(q) : Math.floor(Math.random() * 2 ** 31);
    const now = Date.now();
    try {
      if (mode === 'digital') {
        const t = teams.slice(0, teamCount).map((x) => ({ name: x.name, color: TEAM_COLORS.find((c) => c.name === x.color)!.hex }));
        onStart(createDigital({ level, rounds: r, teams: t, seed }, now));
      } else {
        if (kidNames.length < 3) return setErr('Vul minimaal 3 kinderen in (of kies een aantal).');
        if (kidNames.length > 40) return setErr('Maximaal 40 kinderen.');
        const kids = kidNames.map((name, i) => ({ name, color: useColors ? kidColors[i] : undefined }));
        onStart(createReal({ level, rounds: r, kids, seed }, now));
      }
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <main className="rs">
      <h1 className="rs-title">🎅 De Pietenpakjes-race</h1>
      <p className="rs-sub">Een spel voor in de klas. De leerkracht bedient het met de spatiebalk of de grote knoppen.</p>

      <section className="rs-card">
        <h2>1. Hoe spelen jullie?</h2>
        <div className="rs-opts">
          <button className={`rs-opt ${mode === 'digital' ? 'on' : ''}`} onClick={() => setMode('digital')}>
            <span>💻</span><b>Digitaal</b><small>Teams beantwoorden Pietenvragen en dobbelen om digitale pakjes</small>
          </button>
          <button className={`rs-opt ${mode === 'real' ? 'on' : ''}`} onClick={() => setMode('real')}>
            <span>🎁</span><b>Met echte pakjes</b><small>De hele klas zit in een kring en ruilt echte pakjes</small>
          </button>
        </div>
      </section>

      <section className="rs-card">
        <h2>2. Niveau en rondes</h2>
        <div className="rs-row">
          {LEVELS.map((l) => (
            <button key={l.id} className={`rs-chip ${level === l.id ? 'on' : ''}`} onClick={() => setLevel(l.id)}>{l.label}</button>
          ))}
        </div>
        <label className="rs-lbl">Aantal rondes</label>
        <div className="rs-row">
          <button className="rs-step" onClick={() => setRounds(Math.max(3, r - 1))} aria-label="Minder rondes">−</button>
          <b className="rs-num">{r}</b>
          <button className="rs-step" onClick={() => setRounds(Math.min(20, r + 1))} aria-label="Meer rondes">＋</button>
          <small>(standaard {mode === 'digital' ? 8 : 10})</small>
        </div>
      </section>

      {mode === 'digital' ? (
        <section className="rs-card">
          <h2>3. Teams</h2>
          <div className="rs-row">
            {[4, 5, 6].map((n) => (
              <button key={n} className={`rs-chip ${teamCount === n ? 'on' : ''}`} onClick={() => setTeamCount(n)}>{n} teams</button>
            ))}
          </div>
          {teams.slice(0, teamCount).map((t, i) => (
            <div className="rs-team" key={i}>
              <span className="rs-dot" style={{ background: TEAM_COLORS.find((c) => c.name === t.color)!.hex }} />
              <input className="rs-input" value={t.name} maxLength={22} onChange={(e) => setTeams(teams.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} aria-label={`Naam team ${i + 1}`} />
              <select className="rs-input rs-select" value={t.color} onChange={(e) => setTeams(teams.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)))} aria-label={`Kleur team ${i + 1}`}>
                {TEAM_COLORS.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          ))}
        </section>
      ) : (
        <section className="rs-card">
          <h2>3. De kring</h2>
          <div className="rs-row">
            <button className={`rs-chip ${!byCount ? 'on' : ''}`} onClick={() => setByCount(false)}>Namen invoeren</button>
            <button className={`rs-chip ${byCount ? 'on' : ''}`} onClick={() => setByCount(true)}>Alleen aantal (nummers)</button>
          </div>
          {byCount ? (
            <div className="rs-row">
              <label className="rs-lbl">Aantal kinderen</label>
              <input className="rs-input rs-narrow" type="number" min={3} max={40} value={count} onChange={(e) => setCount(Math.max(3, Math.min(40, Number(e.target.value) || 3)))} />
            </div>
          ) : (
            <>
              <label className="rs-lbl">Namen in de volgorde van de kring (één per regel)</label>
              <textarea className="rs-input rs-area" rows={6} value={names} onChange={(e) => setNames(e.target.value)} placeholder={'Anna\nBram\nChloé\n...'} />
            </>
          )}
          <p className="rs-hint">{kidNames.length} kinderen. De volgorde is de volgorde waarin ze met de klok mee in de kring zitten.</p>
          <label className="rs-check"><input type="checkbox" checked={useColors} onChange={(e) => setUseColors(e.target.checked)} /> Kleur per kind instellen (voor Kleurenpiet)</label>
          {useColors && (
            <div className="rs-kidcolors">
              {kidNames.map((n, i) => (
                <label key={i}>
                  <span>{n}</span>
                  <select className="rs-input rs-select" value={kidColors[i] ?? ''} onChange={(e) => setKidColors({ ...kidColors, [i]: e.target.value })}>
                    <option value="">geen</option>
                    {TEAM_COLORS.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </label>
              ))}
            </div>
          )}
        </section>
      )}

      {err && <p className="rs-err">{err}</p>}
      <button className="rs-go" onClick={go}>▶ Start het spel</button>
      <a className="rs-back" href="/">← Terug naar Pakjesavond Live</a>
    </main>
  );
}
