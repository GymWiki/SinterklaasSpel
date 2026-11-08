'use client';
import Link from 'next/link';
import { useState } from 'react';
import { QR } from '@/components/QR';
import { pinKey } from '@/game/store';

export default function NewGame() {
  const [host, setHost] = useState('');
  const [others, setOthers] = useState(['', '']);
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState<{ id: string } | null>(null);
  const [copied, setCopied] = useState('');

  const names = [host, ...others].map((x) => x.trim()).filter(Boolean);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!host.trim()) return setErr('Vul eerst je eigen naam in.');
    if (names.length < 3) return setErr('Vul minimaal 3 spelers in (jezelf meegeteld).');
    if (pin.trim().length < 4) return setErr('Kies een pincode van minimaal 4 tekens.');
    setBusy(true);
    try {
      const r = await fetch('/api/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hostPin: pin.trim(), players: names }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Er ging iets mis.');
      try { localStorage.setItem(pinKey(j.id), pin.trim()); } catch {}
      setDone({ id: j.id });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const copy = async (label: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(''), 1500); } catch {}
  };

  if (done) {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const join = `${base}/join/${done.id}`;
    const whatsapp = `https://wa.me/?text=${encodeURIComponent(`🎅 Pakjesavond! Vul alvast Het Grote Boek van Sinterklaas met een geheim of gedichtje: ${join}`)}`;
    return (
      <main className="page narrow">
        <h1>🎉 Je spel staat klaar!</h1>
        <section className="card">
          <h2>Kamercode: <span className="code-big">{done.id}</span></h2>
          <p>Deel deze link met je groep (de host hoeft niet online te zijn als ze insturen):</p>
          <div className="linkbox">{join}</div>
          <div className="row wrap">
            <button className="btn" onClick={() => copy('join', join)}>{copied === 'join' ? '✅ Gekopieerd' : '📋 Kopieer link'}</button>
            <a className="btn primary" href={whatsapp} target="_blank" rel="noreferrer">💬 Deel via WhatsApp</a>
          </div>
          <div className="center"><QR text={join} size={200} /></div>
        </section>
        <section className="card">
          <h2>Voor pakjesavond</h2>
          <p>Onthoud je kamercode <b>{done.id}</b> en je pincode. Op pakjesavond open je het spel als host:</p>
          <Link className="btn gold" href={`/host/${done.id}`}>Naar de host-lobby</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page narrow">
      <Link href="/" className="back">← Terug</Link>
      <h1>🗓️ Nieuw spel plannen</h1>
      <form className="card" onSubmit={submit}>
        <label className="lbl">Jouw naam (de host, jij zit straks onderaan)</label>
        <input className="input" value={host} onChange={(e) => setHost(e.target.value)} placeholder="bijv. Sander" maxLength={24} />

        <label className="lbl">Andere spelers (in willekeurige volgorde, de zitkring regel je pas op de avond zelf)</label>
        {others.map((o, i) => (
          <div className="row" key={i}>
            <input className="input" value={o} onChange={(e) => setOthers(others.map((x, j) => (j === i ? e.target.value : x)))} placeholder={['Lisa', 'Tim', 'Noor', 'Daan', 'Emma'][i % 5]} maxLength={24} />
            {others.length > 2 && <button type="button" className="btn small ghost" onClick={() => setOthers(others.filter((_, j) => j !== i))} aria-label="Verwijder">✕</button>}
          </div>
        ))}
        {others.length < 15 && <button type="button" className="btn small" onClick={() => setOthers([...others, ''])}>＋ Speler toevoegen</button>}

        <label className="lbl">Host-pincode (minimaal 4 tekens, hiermee open je het spel op een ander apparaat)</label>
        <input className="input" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="bijv. 1205" maxLength={32} inputMode="text" autoComplete="off" />

        {err && <p className="err">{err}</p>}
        <button className="btn primary big" disabled={busy}>{busy ? 'Bezig...' : 'Spel aanmaken'}</button>
      </form>
    </main>
  );
}
