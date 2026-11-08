'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { loadDemo, DEMO_ID } from '@/game/demo';

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState('');
  return (
    <main className="page">
      <div className="hero">
        <div className="hero-ic">🎅🎲🎁</div>
        <h1>Pakjesavond Live</h1>
        <p>Het dobbelspel voor de woonkamer. Vul vooraf <b>Het Grote Boek van Sinterklaas</b> met geheimen en gedichtjes, speel op pakjesavond met één scherm en één dobbelsteen.</p>
      </div>

      <div className="cards">
        <section className="card">
          <h2>🗓️ Nieuw spel plannen</h2>
          <p>Maak een kamer, vul de spelers in en deel de link in WhatsApp zodat iedereen alvast kan insturen.</p>
          <Link className="btn primary" href="/nieuw">Spel aanmaken</Link>
        </section>

        <section className="card">
          <h2>🎄 Ik ben de host</h2>
          <p>Open je kamer op pakjesavond met je kamercode en pincode.</p>
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              const c = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
              if (c) router.push(`/host/${c}`);
            }}
          >
            <input className="input code-in" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Kamercode (6 tekens)" maxLength={10} autoCapitalize="characters" />
            <button className="btn">Open</button>
          </form>
        </section>

        <section className="card">
          <h2>⚡ Snel testen / Demo-modus</h2>
          <p>Laad met één klik een compleet voorbeeldspel: 6 spelers in een zitkring en 10 ingevulde Grote Boek-inzendingen. Alles draait lokaal.</p>
          <button
            className="btn gold"
            onClick={() => {
              loadDemo();
              router.push(`/host/${DEMO_ID}`);
            }}
          >
            Start demo
          </button>
          <p className="hint">Tip: open daarna het TV-scherm in een tweede tabblad om beide schermen te zien.</p>
        </section>
      </div>
    </main>
  );
}
