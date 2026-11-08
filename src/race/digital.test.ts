import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from './digital';
import { ROLL_MS, questionBank } from './common';
import { TEAM_COLORS, AWARDS } from './common';

const teamsOf = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `Team ${i + 1}`, color: TEAM_COLORS[i].hex }));
const mk = (n = 4, seed = 1, rounds = 8) => D.createDigital({ level: 'g56', rounds, teams: teamsOf(n), seed }, 0);
const total = (s: D.Digital) => s.teams.length * 7;

/** Zet een vaste worp en voert die direct uit (zonder te wachten op de animatie). */
function throwDie(s: D.Digital, die: number): D.Digital {
  return D.tick({ ...s, die, rollPending: true, dieRevealAt: 0 }, 1);
}
/** Geeft team i precies deze aantallen pakjes (de rest gaat naar het midden). */
function setCounts(s: D.Digital, counts: number[]): D.Digital {
  const all = [...s.middle, ...s.teams.flatMap((t) => t.pakjes)];
  let k = 0;
  const teams = s.teams.map((t, i) => ({ ...t, pakjes: all.slice(k, (k += counts[i])) }));
  return { ...s, teams, middle: all.slice(k) };
}
function toRolling(s: D.Digital, correct: string[]): D.Digital {
  let cur = D.toAnswer(s, 0);
  for (const id of correct) cur = D.toggleCorrect(cur, id);
  return D.confirmCorrect(cur);
}

test('start: elk team 1 pakje, midden gevuld, waardes 1-5 / pech (0) / goud (8) en verborgen in de state', () => {
  const s = mk(5);
  assert.equal(s.teams.length, 5);
  assert.ok(s.teams.every((t) => t.pakjes.length === 1));
  assert.equal(s.middle.length, 5 * 6);
  const all = [...s.middle, ...s.teams.flatMap((t) => t.pakjes)];
  assert.ok(all.every((p) => [0, 1, 2, 3, 4, 5, 8].includes(p.v)));
  assert.ok(all.filter((p) => p.v === 8).length >= 1);
  assert.ok(all.filter((p) => p.v === 0).length >= 2);
  assert.deepEqual(D.checkInvariants(s, total(s)), []);
  assert.throws(() => D.createDigital({ level: 'g34', rounds: 8, teams: teamsOf(1), seed: 1 }, 0));
});

test('zelfde seed geeft hetzelfde spel (seedbaar)', () => {
  const a = mk(4, 99), b = mk(4, 99), c = mk(4, 100);
  assert.deepEqual(a.middle.map((p) => p.v), b.middle.map((p) => p.v));
  assert.equal(a.question.id, b.question.id);
  assert.notDeepEqual(a.middle.map((p) => p.v), c.middle.map((p) => p.v));
});

test('timer: 30 sec (of de tijd van de vraag), +15 sec, pauze, doorgaan', () => {
  let s = mk();
  const t0 = s.question.tijd * 1000;
  assert.equal(D.timeLeftMs(s, 0), t0);
  assert.equal(D.timeLeftMs(s, 10_000), t0 - 10_000);
  s = D.addTime(s, 10_000);
  assert.equal(D.timeLeftMs(s, 10_000), t0 - 10_000 + 15_000);
  s = D.togglePause(s, 10_000);
  assert.equal(D.timeLeftMs(s, 99_000), t0 + 5_000); // staat stil
  s = D.addTime(s, 99_000);
  assert.equal(D.timeLeftMs(s, 99_000), t0 + 20_000);
  s = D.togglePause(s, 100_000);
  assert.equal(D.timeLeftMs(s, 105_000), t0 + 15_000);
  assert.equal(D.timeLeftMs(D.togglePause(D.toAnswer(s, 0), 0), 0) >= 0, true);
});

test('vraag overslaan geeft een nieuwe vraag zonder herhaling en herstart de timer', () => {
  let s = mk();
  const first = s.question.id;
  s = D.skipQuestion(s, 5_000);
  assert.notEqual(s.question.id, first);
  assert.equal(D.timeLeftMs(s, 5_000), s.question.tijd * 1000);
  assert.equal(new Set(s.usedQ).size, s.usedQ.length);
});

test('foute teams krijgen een troostpakje; goede teams dobbelen, team met minste pakjes eerst', () => {
  let s = setCounts(mk(4), [3, 1, 2, 1]);
  s = D.toAnswer(s, 0);
  s = D.toggleCorrect(s, 't1');
  s = D.toggleCorrect(s, 't2');
  s = D.toggleCorrect(s, 't4');
  const before = s.teams.map((t) => t.pakjes.length);
  s = D.confirmCorrect(s);
  assert.equal(s.teams[2].pakjes.length, before[2] + 1, 'foute team t3 krijgt troostpakje');
  assert.equal(s.teams[0].pakjes.length, before[0]);
  assert.deepEqual(s.queue, ['t2', 't4', 't1']); // 1, 1 (volgorde van teams), 3
  assert.equal(s.roller, 't2');
  assert.equal(s.phase, 'rolling');
  assert.match(s.message, /Troostpakje voor Team 3/);
});

test('niemand goed: iedereen krijgt een troostpakje en er wordt niet gedobbeld', () => {
  let s = D.toAnswer(mk(4), 0);
  const before = total(s);
  s = D.confirmCorrect(s);
  assert.equal(s.phase, 'scoreboard');
  assert.ok(s.teams.every((t) => t.pakjes.length === 2));
  assert.equal(s.teams.length * 7, before);
});

test('worp 1, 2 en 5: pakken uit het midden (1, 1 en 2 pakjes)', () => {
  const base = toRolling(mk(4), ['t1', 't2', 't3', 't4']);
  const roller = base.roller!;
  const n0 = D.teamById(base, roller).pakjes.length;
  for (const [die, plus] of [[1, 1], [2, 1], [5, 2]] as const) {
    const s = throwDie(base, die);
    assert.equal(D.teamById(s, roller).pakjes.length, n0 + plus, `worp ${die}`);
    assert.equal(s.middle.length, base.middle.length - plus);
    assert.equal(s.rollDone, true);
    assert.deepEqual(D.checkInvariants(s, 28), []);
  }
});

test('maximaal 6 pakjes: het extra pakje gaat terug naar het midden', () => {
  let s = toRolling(setCounts(mk(4), [5, 3, 3, 3]), ['t1', 't2', 't3', 't4']);
  s = { ...s, roller: 't1', queue: ['t1'] };
  const m = s.middle.length;
  const a = throwDie(s, 5);
  assert.equal(D.teamById(a, 't1').pakjes.length, 6);
  assert.equal(a.middle.length, m - 1);
  assert.match(a.message, /max\. 6/);
  const b = throwDie({ ...a, rollDone: false }, 1);
  assert.equal(D.teamById(b, 't1').pakjes.length, 6);
  assert.equal(b.middle.length, a.middle.length);
});

test('worp 3: alleen te bestelen bij teams met MEER pakjes dan jij; team met 1 pakje is veilig', () => {
  let s = toRolling(setCounts(mk(4), [2, 1, 3, 2]), ['t2']);
  assert.equal(s.roller, 't2');
  assert.deepEqual(D.stealOptions(s, 't2'), ['t1', 't3', 't4']);
  s = setCounts(mk(4), [3, 1, 1, 2]);
  s = { ...s, phase: 'rolling', roller: 't4', queue: ['t4'] };
  assert.deepEqual(D.stealOptions(s, 't4'), ['t1']);
  // team 2 en 3 hebben 1 pakje: nooit een optie, ook niet voor een roller met 1
  const r = { ...s, roller: 't2' };
  assert.ok(!D.stealOptions(r, 't2').includes('t3'));
  const t = throwDie(r, 3);
  assert.equal(t.phase, 'choose');
  assert.equal(D.chooseTeam(t, 't3'), t, 'ongeldig doelwit wordt genegeerd');
});

test('worp 3: pakje gaat van het gekozen team naar de roller, niet leeg, en per ronde maar 1x bestolen', () => {
  let s = setCounts(mk(4), [3, 2, 1, 1]);
  s = { ...s, phase: 'rolling', roller: 't2', queue: ['t2', 't3'] };
  s = throwDie(s, 3);
  assert.deepEqual(s.choose!.options, ['t1']);
  s = D.chooseTeam(s, 't1');
  assert.equal(D.teamById(s, 't1').pakjes.length, 2);
  assert.equal(D.teamById(s, 't2').pakjes.length, 3);
  assert.deepEqual(s.robbed, ['t1']);
  assert.equal(s.phase, 'rolling');
  // volgende roller (t3 heeft 1) kan t1 niet meer bestelen deze ronde, ook al heeft t1 meer
  s = D.primary(s, 0);
  assert.equal(s.roller, 't3');
  assert.ok(!D.stealOptions(s, 't3').includes('t1'));
  assert.ok(D.stealOptions(s, 't3').includes('t2'));
  const f = throwDie({ ...s, robbed: ['t1', 't2'] }, 3); // niemand te bestelen -> uit het midden
  assert.equal(f.phase, 'rolling');
  assert.equal(D.teamById(f, 't3').pakjes.length, 2);
  assert.match(f.message, /Niemand om te bestelen/);
});

test('worp 4 Schudpiet: elk team geeft één pakje naar links, aantallen blijven gelijk', () => {
  const base = toRolling(setCounts(mk(4), [3, 1, 2, 4]), ['t1', 't2', 't3', 't4']);
  const s = throwDie(base, 4);
  assert.deepEqual(s.teams.map((t) => t.pakjes.length), [3, 1, 2, 4]);
  assert.equal(s.middle.length, base.middle.length);
  // het pakje van team 2 (had er maar 1) zit nu bij team 3
  const given = base.teams[1].pakjes[0];
  assert.ok(s.teams[2].pakjes.some((p) => p.id === given.id));
  assert.ok(!s.teams[1].pakjes.some((p) => p.id === given.id));
  assert.deepEqual(D.checkInvariants(s, 28), []);
  assert.match(s.message, /links/);
});

test('worp 6 Sinterklaas: stapel ruilen met een team naar keuze (of niet ruilen)', () => {
  const base = toRolling(setCounts(mk(4), [1, 3, 2, 4]), ['t1']);
  const c = throwDie(base, 6);
  assert.equal(c.phase, 'choose');
  assert.deepEqual(c.choose!.options, ['t2', 't3', 't4']);
  const a = c.teams[0].pakjes.map((p) => p.id), b = c.teams[3].pakjes.map((p) => p.id);
  const s = D.chooseTeam(c, 't4');
  assert.deepEqual(s.teams[0].pakjes.map((p) => p.id), b);
  assert.deepEqual(s.teams[3].pakjes.map((p) => p.id), a);
  assert.equal(s.phase, 'rolling');
  assert.equal(D.skipSwap(c).rollDone, true);
  assert.deepEqual(D.skipSwap(c).teams.map((t) => t.pakjes.length), c.teams.map((t) => t.pakjes.length));
});

test('dubbelklik-veilig: worp pas na animatie, niet dubbel, en spatiebalk volgt de fases', () => {
  let s = toRolling(mk(4), ['t1', 't2']);
  const r1 = D.roll(s, 1000);
  assert.equal(r1.rollPending, true);
  assert.equal(D.roll(r1, 1001), r1, 'tweede worp wordt genegeerd');
  assert.equal(D.primary(r1, 1002), r1, 'spatie tijdens het rollen doet niets');
  assert.equal(D.tick(r1, 1000 + ROLL_MS - 1), r1);
  const done = D.tick(r1, 1000 + ROLL_MS + 1);
  assert.equal(done.rollPending, false);
});

test('eerlijke volgorde: na elke ronde begint het team met de minste pakjes', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const s = toRolling(mk(5, seed), ['t1', 't2', 't3', 't4', 't5']);
    const counts = s.queue.map((id) => D.teamById(s, id).pakjes.length);
    assert.deepEqual(counts, [...counts].sort((a, b) => a - b));
  }
});

/** Speelt een heel spel met willekeurige keuzes en controleert na elke stap alle regels. */
function autoplay(seed: number, n: number, rounds: number) {
  let s = mk(n, seed, rounds);
  let now = 0;
  let r = seed * 7919;
  const rnd = () => ((r = (r * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const tot = total(s);
  const log: string[] = [];
  for (let step = 0; step < 5000 && s.phase !== 'done'; step++) {
    now += 500;
    switch (s.phase) {
      case 'question': if (rnd() < 0.2) s = D.skipQuestion(s, now); else if (rnd() < 0.3) s = D.addTime(D.togglePause(D.togglePause(s, now), now), now); else s = D.primary(s, now); break;
      case 'answer': for (const t of s.teams) if (rnd() < 0.55) s = D.toggleCorrect(s, t.id); s = D.primary(s, now); break;
      case 'rolling': if (s.die === null) s = D.roll(s, now); else if (s.rollPending) s = D.tick(s, now + ROLL_MS); else s = D.primary(s, now); break;
      case 'choose': s = rnd() < 0.15 && s.choose!.kind === 'swap' ? D.skipSwap(s) : D.chooseTeam(s, s.choose!.options[Math.floor(rnd() * s.choose!.options.length)]); break;
      default: s = D.primary(s, now);
    }
    const bad = D.checkInvariants(s, tot);
    assert.deepEqual(bad, [], `seed ${seed} stap ${step} fase ${s.phase}: ${bad.join('; ')}`);
    log.push(s.phase);
  }
  assert.equal(s.phase, 'done', `spel eindigt (seed ${seed})`);
  return { s, log };
}

test('volledige spellen (4, 5 en 6 teams, 8 rondes): regels gelden na elke stap en het spel eindigt', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const n = 4 + (seed % 3);
    const { s } = autoplay(seed, n, 8);
    assert.equal(s.round, 8);
    assert.ok(s.teams.every((t) => t.pakjes.length >= 1 && t.pakjes.length <= 6));
    assert.equal(new Set(s.usedQ).size, s.usedQ.length, 'geen vraag dubbel');
  }
});

test('geen enkele vraag komt dubbel voor in een spel met veel rondes', () => {
  const { s } = autoplay(5, 4, questionBank('g56').length);
  assert.equal(s.usedQ.length, new Set(s.usedQ).size);
});

test('finale: onthul-volgorde laagste eerst, winnaar(s) = hoogste telling, gelijkspel = beide winnen', () => {
  let s = mk(4);
  // vaste waardes: t1=3+2, t2=8 (goud), t3=5, t4=8
  const vals = [[3, 2], [8], [5], [4, 4]];
  s = { ...s, teams: s.teams.map((t, i) => ({ ...t, pakjes: vals[i].map((v, k) => ({ id: 100 + i * 10 + k, v })) })), phase: 'finale', finaleRevealed: 0 };
  assert.deepEqual(D.totals(s).map((x) => x.total), [5, 8, 5, 8]);
  assert.deepEqual(D.finaleOrder(s), ['t1', 't3', 't2', 't4']);
  assert.deepEqual(D.winners(s), ['t2', 't4']);
  let f = s;
  for (let i = 0; i < 3; i++) { f = D.revealNext(f); assert.equal(f.phase, 'finale'); }
  f = D.revealNext(f);
  assert.equal(f.phase, 'awards');
  // pietenpech telt als 0 en goud als 8
  const z = { ...s, teams: s.teams.map((t, i) => (i === 0 ? { ...t, pakjes: [{ id: 1, v: 0 }, { id: 2, v: 0 }] } : t)) };
  assert.equal(D.totals(z)[0].total, 0);
});

test('bijzondere prijzen: leerkracht kent toe, elke prijs maar aan één team', () => {
  let s = mk(4);
  s = { ...s, phase: 'awards' };
  s = D.setAward(s, 't1', AWARDS[0]);
  s = D.setAward(s, 't2', AWARDS[1]);
  s = D.setAward(s, 't3', AWARDS[0]); // prijs 0 verhuist naar t3
  assert.deepEqual(s.awards, { t2: AWARDS[1], t3: AWARDS[0] });
  s = D.setAward(s, 't2', null);
  assert.deepEqual(s.awards, { t3: AWARDS[0] });
  assert.equal(D.primary(s, 0).phase, 'done');
});

test('waardes zijn pas in de finale nodig: scorebord toont alleen aantallen', () => {
  const s = mk(4);
  const sb = D.totals(s);
  assert.ok(sb.every((x) => typeof x.count === 'number'));
  // de UI mag alleen `count` tonen voor de finale; de engine bewaart de waardes (voor de finale-telling)
  assert.ok(s.teams[0].pakjes[0].v >= 0);
});
