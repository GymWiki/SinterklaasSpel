'use client';
import { useMemo, useState } from 'react';
import { Ring } from './Ring';
import { QR } from './QR';
import { PlayersPanel } from './PlayersPanel';
import { canStart, mergeSubmissions, removeSubmission, setSettings, startRound1 } from '@/game/engine';
import { AUDIENCES } from '@/content/tags';
import { pinKey, clearLocal } from '@/game/store';
import type { GameState, Submission } from '@/game/types';

type Upd = (fn: (s: GameState, now: number) => GameState) => void;

const words = (t: string) => new Set(t.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).filter((w) => w.length > 2));
function dupIds(subs: Submission[]): Set<string> {
  const out = new Set<string>();
  const ws = subs.map((s) => words(s.content));
  for (let i = 0; i < subs.length; i++)
    for (let j = i + 1; j < subs.length; j++) {
      if (subs[i].targetPlayerName !== subs[j].targetPlayerName) continue;
      const inter = [...ws[i]].filter((w) => ws[j].has(w)).length;
      const uni = new Set([...ws[i], ...ws[j]]).size || 1;
      if (inter / uni >= 0.6) { out.add(subs[i].id); out.add(subs[j].id); }
    }
  return out;
}
const mask = (t: string) => t.replace(/\S/g, '▇').slice(0, 26);

export function Lobby({ state: s, update, replace }: { state: GameState; update: Upd; replace: (s: GameState) => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const joinUrl = `${origin}/join/${s.roomId}`;
  const dups = useMemo(() => dupIds(s.submissions), [s.submissions]);

  const getPin = () => {
    let pin = '';
    try { pin = localStorage.getItem(pinKey(s.roomId)) ?? ''; } catch {}
    if (!pin) pin = window.prompt('Host-pincode:') ?? '';
    return pin.trim();
  };

  async function refresh() {
    if (s.isDemo) return setMsg('In de demo zijn er geen nieuwe inzendingen om te verversen.');
    const pin = getPin();
    if (!pin) return;
    setBusy(true);
    setMsg('');
    try {
      const r = await fetch(`/api/rooms/${s.roomId}/host`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Verversen mislukt.');
      try { localStorage.setItem(pinKey(s.roomId), pin); } catch {}
      const before = s.submissions.length;
      const merged = mergeSubmissions(s, j.submissions as Submission[]);
      if (merged !== s) replace(merged);
      setMsg(merged.submissions.length > before ? `🎁 ${merged.submissions.length - before} nieuwe inzending(en) binnen!` : 'Geen nieuwe inzendingen.');
    } catch (e: any) {
      setMsg(`⚠️ ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function del(sub: Submission) {
    if (!window.confirm('Deze inzending verwijderen? (De tekst blijft verborgen.)')) return;
    update((st) => removeSubmission(st, sub.id));
    if (s.isDemo) return;
    try {
      await fetch(`/api/rooms/${s.roomId}/submissions/${sub.id}`, { method: 'DELETE', headers: { 'x-host-pin': getPin() } });
    } catch {}
  }

  const byAuthor = useMemo(() => {
    const m = new Map<string, number>();
    s.submissions.forEach((x) => m.set(x.authorName, (m.get(x.authorName) ?? 0) + 1));
    return [...m.entries()];
  }, [s.submissions]);

  return (
    <div className="stack">
      <section className="card book-card">
        <h2>📖 Het Grote Boek is geladen met <b>{s.submissions.length}</b> geheimen en gedichten!</h2>
        {s.loadedAt && <p className="hint">Laatst opgehaald om {new Date(s.loadedAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}. Tijdens het spel zijn er geen database-requests meer nodig.</p>}
        <button className="btn gold big" onClick={refresh} disabled={busy}>{busy ? 'Bezig...' : '🔄 Ververs inzendingen'}</button>
        {msg && <p className="ok">{msg}</p>}
        {!s.isDemo && (
          <div className="share">
            <QR text={joinUrl} size={150} />
            <div>
              <b>Last-minute inzenden</b>
              <p className="hint">Laat gasten deze QR-code scannen of deel de link:</p>
              <div className="linkbox sm">{joinUrl}</div>
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <h2>📺 TV-scherm</h2>
        <p>Open het TV-scherm in een <b>tweede tabblad of venster op dezelfde laptop</b> (en zet dat op de TV). Beide schermen synchroniseren automatisch, zonder internet of database.</p>
        <a className="btn primary" href={`/tv/${s.roomId}`} target="_blank" rel="noreferrer">📺 Open TV-scherm in nieuw tabblad</a>
        <p className="hint">Op het TV-scherm staat een grote knop &quot;🔊 Activeer TV-Scherm &amp; Geluid&quot; voor de geluidseffecten.</p>
      </section>

      <section className="card">
        <h2>🪑 De Zitkring</h2>
        <p>Zet de spelers in de volgorde waarin ze nu met de klok mee in de woonkamer zitten. Begin bij jezelf onderaan (6 uur). Sleep om te wisselen.</p>
        <div className="ring-prev"><Ring mini players={s.players} activeId={s.players[0]?.id} /></div>
        <PlayersPanel state={s} update={update} />
      </section>

      <section className="card">
        <h2>⚙️ Spelinstellingen</h2>
        <label className="lbl">Sfeer / doelgroep</label>
        <div className="opts">
          {AUDIENCES.map((a) => (
            <button key={a.id} className={`opt ${s.settings.audience === a.id ? 'on' : ''}`} onClick={() => update((st) => setSettings(st, { audience: a.id }))}>
              <span>{a.emoji}</span><b>{a.label}</b><small>{a.desc}</small>
            </button>
          ))}
        </div>
        <label className="lbl">Speelduur Ronde 2 (de echte eindtijd blijft geheim, ±13%)</label>
        <div className="seg">
          {[...(s.isDemo ? [3] : []), 20, 30, 45].map((m) => (
            <button key={m} className={s.settings.r2Minutes === m ? 'on' : ''} onClick={() => update((st) => setSettings(st, { r2Minutes: m }))}>{m} min{m === 3 ? ' (test)' : ''}</button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>🙈 Inzendingen (gemaskeerd)</h2>
        <p className="hint">Zo blijft de tekst een verrassing. Verwijder alleen dubbele inzendingen (⚠️ = lijkt erg op een andere).</p>
        {byAuthor.length > 0 && <p className="hint">Per inzender: {byAuthor.map(([a, n]) => `${a} (${n})`).join(', ')}</p>}
        <ul className="sublist">
          {s.submissions.map((x, i) => (
            <li key={x.id} className={dups.has(x.id) ? 'dup' : ''}>
              <span className="si">{x.type === 'poem' ? '🎶' : '🤫'}</span>
              <span className="sm"><b>#{i + 1}</b> van {x.authorName} <code>{mask(x.content)}</code></span>
              {dups.has(x.id) && <span title="Mogelijk dubbel">⚠️</span>}
              <button className="btn small ghost" onClick={() => del(x)} aria-label="Verwijderen">🗑️</button>
            </li>
          ))}
          {!s.submissions.length && <li className="empty">Nog geen inzendingen. Het spel gebruikt dan de ingebouwde Grote Boek-vragen.</li>}
        </ul>
      </section>

      <section className="card start-card">
        {!canStart(s) && <p className="err">Minimaal 3 spelers die niet op pauze staan.</p>}
        <button className="btn primary huge" disabled={!canStart(s)} onClick={() => update(startRound1)}>🎅 Start Ronde 1: de Uitpakronde</button>
        <button
          className="linkbtn"
          onClick={() => {
            if (!window.confirm('Lokale spelstate wissen en alles opnieuw uit de cloud laden?')) return;
            clearLocal(s.roomId);
            window.location.reload();
          }}
        >
          Alles opnieuw laden (lokale state wissen)
        </button>
      </section>
    </div>
  );
}
