'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Lobby } from '@/components/Lobby';
import { Controller } from '@/components/Controller';
import { createState } from '@/game/engine';
import { DEMO_ID, loadDemo } from '@/game/demo';
import { FEATURES } from '@/lib/features';
import { pinKey, useHostGame, useNow, useWakeLock } from '@/game/store';
import { useSoundDriver } from '@/game/useSound';
import { sfx } from '@/game/sound';
import type { GameState, Submission } from '@/game/types';

function Gate({ roomId, onLoaded }: { roomId: string; onLoaded: (s: GameState) => void }) {
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => {
    try { setPin(localStorage.getItem(pinKey(roomId)) ?? ''); } catch {}
  }, [roomId]);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      // Fase 2: één enkele API-call haalt de kamer en alle inzendingen op.
      const r = await fetch(`/api/rooms/${roomId}/host`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: pin.trim() }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Openen mislukt.');
      try { localStorage.setItem(pinKey(roomId), pin.trim()); } catch {}
      onLoaded(createState(roomId, j.room.players, j.submissions as Submission[]));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="page narrow">
      <Link href="/" className="back">← Terug</Link>
      <h1>🎄 Host-toegang</h1>
      <form className="card" onSubmit={go}>
        <p>Kamer <span className="code-big">{roomId}</span></p>
        <label className="lbl">Host-pincode</label>
        <input className="input" value={pin} onChange={(e) => setPin(e.target.value)} autoComplete="off" autoFocus />
        {err && <p className="err">{err}</p>}
        <button className="btn primary big" disabled={busy || pin.trim().length < 4}>{busy ? 'Het Grote Boek wordt geladen...' : 'Open het spel'}</button>
      </form>
    </main>
  );
}

export default function HostPage() {
  const { roomId: raw } = useParams<{ roomId: string }>();
  const roomId = raw === DEMO_ID ? DEMO_ID : String(raw).toUpperCase();
  const { state, loaded, update, replace, tvAlive } = useHostGame(roomId);
  const now = useNow(250);
  useWakeLock(true);
  useSoundDriver(state, now, !tvAlive());

  useEffect(() => {
    const unlock = () => sfx.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);
  useEffect(() => {
    if (!loaded || state) return;
    if (roomId === DEMO_ID) replace(loadDemo());
    else if (!FEATURES.book) replace(createState(roomId, [], [])); // MVP: gewoon lokaal beginnen, geen database
  }, [loaded, state, roomId, replace]);

  if (!loaded) return <main className="page narrow"><p>Laden...</p></main>;
  if (!state) return roomId === DEMO_ID || !FEATURES.book ? <main className="page narrow"><p>Spel klaarzetten...</p></main> : <Gate roomId={roomId} onLoaded={replace} />;

  return (
    <main className="page host">
      <header className="host-head">
        <Link href="/" className="back">← Start</Link>
        <h1>🎅 Pakjesavond Live {state.isDemo && <span className="chip">DEMO</span>}{FEATURES.book && <span className="chip">{state.roomId}</span>}</h1>
      </header>
      {state.phase === 'lobby' ? <Lobby state={state} update={update} replace={replace} /> : <Controller state={state} update={update} now={now} />}
    </main>
  );
}
