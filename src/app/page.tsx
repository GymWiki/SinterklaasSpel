'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadDemo, loadDemoClass, DEMO_ID } from '@/game/demo';
import { clearLocal, loadLocal } from '@/game/store';

const LOCAL_ID = 'spel';

export default function Home() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  useEffect(() => {
    const s = loadLocal(LOCAL_ID);
    setRunning(!!s && (s.players.length > 0 || s.phase !== 'lobby'));
  }, []);

  return (
    <main className="page narrow">
      <div className="hero">
        <div className="hero-ic">🎅🎲🎁</div>
        <h1>Pakjesavond Live</h1>
        <p>Het dobbelspel voor de woonkamer: één scherm, één dobbelsteen en een zitkring vol cadeaus. Alles draait lokaal op dit apparaat.</p>
      </div>

      <div className="cards">
        {running && (
          <section className="card">
            <h2>▶️ Verder met het lopende spel</h2>
            <p>Je spel staat nog klaar op dit apparaat.</p>
            <button className="btn primary big" onClick={() => router.push(`/host/${LOCAL_ID}`)}>Verder spelen</button>
          </section>
        )}

        <section className="card">
          <h2>🎄 Nieuw spel</h2>
          <p>Voer de spelers in op zitvolgorde, kies de jongste speler en de sfeer, en speel direct met het TV-scherm en de host-controller.</p>
          <button
            className={`btn big ${running ? '' : 'primary'}`}
            onClick={() => {
              if (running && !window.confirm('Het lopende spel wissen en opnieuw beginnen?')) return;
              clearLocal(LOCAL_ID);
              router.push(`/host/${LOCAL_ID}`);
            }}
          >
            Nieuw spel opzetten
          </button>
        </section>

        <section className="card">
          <h2>⚡ Snel testen / Demo-modus</h2>
          <p>Laad met één klik een voorbeeldspel met 6 spelers in een zitkring.</p>
          <button
            className="btn gold"
            onClick={() => {
              loadDemo();
              router.push(`/host/${DEMO_ID}`);
            }}
          >
            Start demo
          </button>
          <button className="btn" onClick={() => { loadDemoClass(); router.push(`/host/${DEMO_ID}`); }}>🏫 Demo Klassikale Modus (32 leerlingen)</button>
          <p className="hint">Tip: open daarna het TV-scherm in een tweede tabblad om beide schermen te zien.</p>
        </section>
      </div>
    </main>
  );
}
