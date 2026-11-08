'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, redirect } from 'next/navigation';
import { FEATURES } from '@/lib/features';
import { POEM_PROMPTS, SECRET_PROMPTS, STATEMENTS, POEM_LEADS_HINT } from '@/content/prompts';
import { GENERAL_TARGET, MAX_CONTENT, composeContent, contentOk, countWords } from '@/lib/constants';

type Type = 'secret' | 'poem';
const OTHER = '__other__';
const authorKey = (id: string) => `pakjesavond:author:${id}`;

export default function JoinPage() {
  if (!FEATURES.book) redirect('/'); // MVP: Grote Boek / vooraf insturen staat uit
  const { roomId: raw } = useParams<{ roomId: string }>();
  const roomId = String(raw).toUpperCase();
  const [players, setPlayers] = useState<string[] | null>(null);
  const [loadErr, setLoadErr] = useState('');
  const [mode, setMode] = useState<'write' | 'quick'>('write');
  const [spicy, setSpicy] = useState(false);
  const [step, setStep] = useState(1);

  const [authorSel, setAuthorSel] = useState('');
  const [authorOther, setAuthorOther] = useState('');
  const [type, setType] = useState<Type>('secret');
  const [target, setTarget] = useState('');
  const [typed, setTyped] = useState('');
  const [promptIdx, setPromptIdx] = useState(0);
  const [stmtIdx, setStmtIdx] = useState<number | null>(null);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(0);

  useEffect(() => {
    fetch(`/api/rooms/${roomId}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Kamer niet gevonden.');
        setPlayers(j.players);
        try {
          const a = localStorage.getItem(authorKey(roomId));
          if (a && j.players.includes(a)) setAuthorSel(a);
        } catch {}
      })
      .catch((e) => setLoadErr(e.message));
  }, [roomId]);

  const tags = spicy ? ['a', 'k', 'm', 'v'] : ['a', 'k', 'm'];
  const prompts = useMemo(() => (type === 'secret' ? SECRET_PROMPTS : POEM_PROMPTS).filter((p) => p.tags.some((t) => tags.includes(t))), [type, spicy]); // eslint-disable-line react-hooks/exhaustive-deps
  const statements = useMemo(() => STATEMENTS.map((s, i) => ({ ...s, i })).filter((s) => s.tags.some((t) => tags.includes(t))), [spicy]); // eslint-disable-line react-hooks/exhaustive-deps
  const prompt = prompts[promptIdx % Math.max(prompts.length, 1)];

  const author = (authorSel === OTHER ? authorOther : authorSel).trim();
  const step1ok = !!author && !!target;
  const typedOk = contentOk(typed);
  const content = mode === 'quick' ? (stmtIdx !== null ? STATEMENTS[stmtIdx].text : '') : prompt ? composeContent(prompt.lead, typed) : '';
  const targetLabel = target === GENERAL_TARGET ? 'DE HELE GROEP' : target.toUpperCase();

  function otherPrompt() {
    if (prompts.length < 2) return;
    setPromptIdx((i) => (i + 1 + Math.floor(Math.random() * (prompts.length - 1))) % prompts.length);
  }

  async function send() {
    setErr('');
    setBusy(true);
    try {
      const r = await fetch(`/api/rooms/${roomId}/submissions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName: author, targetPlayerName: target, type: mode === 'quick' ? 'secret' : type, content }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Versturen mislukt.');
      try { localStorage.setItem(authorKey(roomId), author); } catch {}
      setSent((n) => n + 1);
      setTyped('');
      setStmtIdx(null);
      setStep(1);
      setTarget('');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (loadErr) return <main className="page narrow"><h1>😕 Oeps</h1><p className="err">{loadErr}</p></main>;
  if (!players) return <main className="page narrow"><p>Laden...</p></main>;

  const authorTargetBlock = (
    <>
      <label className="lbl">Wie ben jij?</label>
      <select className="input" value={authorSel} onChange={(e) => setAuthorSel(e.target.value)}>
        <option value="">Kies je naam...</option>
        {players.map((p) => <option key={p}>{p}</option>)}
        <option value={OTHER}>Iemand anders...</option>
      </select>
      {authorSel === OTHER && <input className="input" value={authorOther} onChange={(e) => setAuthorOther(e.target.value)} placeholder="Jouw naam" maxLength={24} />}

      <label className="lbl">Over wie uit de groep gaat dit?</label>
      <select className="input" value={target} onChange={(e) => setTarget(e.target.value)}>
        <option value="">Kies een persoon...</option>
        {players.map((p) => <option key={p}>{p}</option>)}
        <option value={GENERAL_TARGET}>{GENERAL_TARGET}</option>
      </select>
      <p className="hint">🤫 Tijdens het spel blijft dit geheim tot de groep geraden heeft over wie het gaat.</p>
    </>
  );

  const tvPreview = (text: string) => (
    <div className="tvprev">
      <div className="tvprev-bar">📺 Zo ziet het er straks op de TV uit</div>
      <div className="tvprev-body">
        <div className="tvprev-lead">📖 Sinterklaas leest voor uit Het Grote Boek:</div>
        <div className="tvprev-text">{text ? `“${text}”` : '…'}</div>
        <div className="tvprev-q">Over wie in deze kamer gaat dit?</div>
        <div className="tvprev-rev">
          {target ? <>Het was <b>{targetLabel}</b>! {target === GENERAL_TARGET ? 'Iedereen geeft een cadeau door.' : <>{target} moet nu het mooiste cadeau afstaan aan degene die aan de beurt is!</>}</> : 'Daarna volgt een automatische cadeau-ruilopdracht.'}
        </div>
      </div>
    </div>
  );

  return (
    <main className="page narrow">
      <h1>📖 Het Grote Boek van Sinterklaas</h1>
      <p>Stuur een geheim of gedichtje in. Sinterklaas leest het op pakjesavond voor, en niemand weet van wie het komt.</p>
      {sent > 0 && <div className="ok">🎁 Ingestuurd! Dat waren er al {sent}. Nog eentje? Hoe meer, hoe leuker.</div>}

      <div className="tabs">
        <button className={mode === 'write' ? 'on' : ''} onClick={() => { setMode('write'); setErr(''); }}>✍️ Zelf schrijven</button>
        <button className={mode === 'quick' ? 'on' : ''} onClick={() => { setMode('quick'); setErr(''); }}>🛋️ Geen inspiratie? Kies een kant-en-klare stelling</button>
      </div>
      <label className="switch"><input type="checkbox" checked={spicy} onChange={(e) => { setSpicy(e.target.checked); setPromptIdx(0); setStmtIdx(null); }} /> 🌶️ Pittig (18+ vragen en stellingen)</label>

      {mode === 'write' ? (
        <section className="card">
          <div className="steps">{[1, 2, 3].map((n) => <span key={n} className={n === step ? 'on' : n < step ? 'done' : ''}>{n}</span>)}<em>Stap {step} van 3</em></div>

          {step === 1 && (
            <>
              {authorTargetBlock}
              <label className="lbl">Wat wil je insturen?</label>
              <div className="seg">
                <button className={type === 'secret' ? 'on' : ''} onClick={() => { setType('secret'); setPromptIdx(0); }}>🤫 Een geheim</button>
                <button className={type === 'poem' ? 'on' : ''} onClick={() => { setType('poem'); setPromptIdx(0); }}>🎶 Een gedichtje</button>
              </div>
              <button className="btn primary big" disabled={!step1ok} onClick={() => setStep(2)}>Volgende ➡️</button>
            </>
          )}

          {step === 2 && prompt && (
            <>
              <div className="prompt">
                <div className="prompt-q">💡 {prompt.q}</div>
                <button className="btn small" onClick={otherPrompt}>🔄 Geef een andere vraag</button>
              </div>
              <label className="lbl">{type === 'secret' ? 'Maak de zin af:' : 'Schrijf het rijmpje af:'}</label>
              <div className="lead">{prompt.lead}</div>
              <textarea className="input area" rows={type === 'poem' ? 4 : 3} value={typed} maxLength={MAX_CONTENT - 80} onChange={(e) => setTyped(e.target.value)} placeholder={`bijv. ${prompt.example}`} />
              <div className={`count ${typedOk ? 'good' : ''}`}>{countWords(typed)} woorden · {typed.trim().length} tekens {typedOk ? '✅' : '(minimaal 3 woorden en 15 tekens)'}</div>
              {type === 'poem' && <p className="hint">{POEM_LEADS_HINT}</p>}
              <div className="row">
                <button className="btn ghost" onClick={() => setStep(1)}>⬅️ Terug</button>
                <button className="btn primary grow" disabled={!typedOk} onClick={() => setStep(3)}>Bekijk de TV-preview ➡️</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {tvPreview(content)}
              <p className="hint">De app plakt er zelf automatisch een cadeau-ruilopdracht aan vast. Jij hoeft alleen de zin te schrijven.</p>
              {err && <p className="err">{err}</p>}
              <div className="row">
                <button className="btn ghost" onClick={() => setStep(2)}>⬅️ Aanpassen</button>
                <button className="btn primary grow" disabled={busy} onClick={send}>{busy ? 'Versturen...' : '🎁 Stuur in bij Sinterklaas'}</button>
              </div>
            </>
          )}
        </section>
      ) : (
        <section className="card">
          {authorTargetBlock}
          <label className="lbl">Kies een stelling over deze persoon:</label>
          <div className="stmts">
            {statements.map((s) => (
              <button key={s.i} className={`stmt ${stmtIdx === s.i ? 'on' : ''}`} onClick={() => setStmtIdx(s.i)}>{s.text}</button>
            ))}
          </div>
          {stmtIdx !== null && step1ok && tvPreview(content)}
          {err && <p className="err">{err}</p>}
          <button className="btn primary big" disabled={busy || !step1ok || stmtIdx === null} onClick={send}>{busy ? 'Versturen...' : '🎁 Stuur in bij Sinterklaas'}</button>
        </section>
      )}
    </main>
  );
}
