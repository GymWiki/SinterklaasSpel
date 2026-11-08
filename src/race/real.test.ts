import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from './real';
import { ROLL_MS, TEAM_COLORS } from './common';

const kids = (n: number, colors = false) => Array.from({ length: n }, (_, i) => ({ name: `Kind ${i + 1}`, ...(colors ? { color: TEAM_COLORS[i % 4].name } : {}) }));
const mk = (n = 24, seed = 1, rounds = 10, colors = false) => R.createReal({ level: 'g56', rounds, kids: kids(n, colors), seed }, 0);

function withDie(s: R.Real, die: number): R.Real {
  return R.tick({ ...s, phase: 'rolling', die, rollPending: true, dieRevealAt: 0 }, 1);
}

test('setup: kringvolgorde = volgorde van invoer, nummers als er geen namen zijn', () => {
  const s = mk(5);
  assert.deepEqual(s.kids.map((k) => k.name), ['Kind 1', 'Kind 2', 'Kind 3', 'Kind 4', 'Kind 5']);
  assert.deepEqual(R.numberedKids(4).map((k) => k.name), ['1', '2', '3', '4']);
  assert.throws(() => R.createReal({ level: 'g34', rounds: 10, kids: kids(2), seed: 1 }, 0));
});

test('worp 1 en 2: iedereen geeft door naar links / rechts, met pijl', () => {
  const l = withDie(mk(), 1), r = withDie(mk(), 2);
  assert.equal(l.phase, 'result');
  assert.equal(l.result!.arrow, 'left');
  assert.match(l.result!.text, /LINKS/);
  assert.equal(r.result!.arrow, 'right');
  assert.match(r.result!.text, /RECHTS/);
});

test('worp 3: overbuur-koppels zijn recht tegenover elkaar, disjunct, en bij oneven blijft er één over', () => {
  for (const n of [3, 4, 5, 8, 9, 24, 25, 31]) {
    const { pairs, unpaired } = R.oppositePairs(n);
    const all = [...pairs.flat(), ...unpaired];
    assert.equal(all.length, n, `n=${n}`);
    assert.equal(new Set(all).size, n);
    assert.equal(unpaired.length, n % 2);
    for (const [a, b] of pairs) {
      const d = (b - a + n) % n;
      assert.ok(d === Math.floor(n / 2) || d === Math.ceil(n / 2), `n=${n} ${a}-${b}`);
    }
  }
  const s = withDie(mk(7), 3);
  assert.equal(s.result!.pairs!.length, 3);
  assert.equal(s.result!.unpaired!.length, 1);
  assert.deepEqual(R.checkResult(s), []);
});

test('worp 4 Kleurenpiet: tv toont een kleur, wie die kleur draagt ruilt met de buurman (koppels disjunct)', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const s = withDie(mk(24, seed, 10, true), 4);
    const r = s.result!;
    assert.ok(r.color);
    assert.ok(r.wearers!.length > 0);
    assert.ok(r.wearers!.every((id) => R.kidById(s, id).color === r.color!.name));
    assert.deepEqual(R.checkResult(s), []);
    for (const [a, b] of r.pairs!) {
      const ia = s.kids.findIndex((k) => k.id === a), ib = s.kids.findIndex((k) => k.id === b);
      const d = Math.abs(ia - ib);
      assert.ok(d === 1 || d === s.kids.length - 1, 'buurman');
    }
    // elke drager zit in een koppel of staat op unpaired
    const placed = new Set([...r.pairs!.flat().filter((id) => r.wearers!.includes(id)), ...r.unpaired!]);
    assert.ok(r.wearers!.every((id) => placed.has(id) || r.pairs!.some((p) => p.includes(id))));
  }
});

test('Kleurenpiet zonder ingestelde kleuren: tv toont een kleur, de kinderen kijken zelf (geen wearers)', () => {
  const s = withDie(mk(10), 4);
  assert.ok(s.result!.color);
  assert.deepEqual(s.result!.wearers, []);
  assert.deepEqual(s.result!.pairs, []);
});

test('worp 5 Pietenvraag: tv kiest 3 verschillende kinderen, daarna een vraag met timer', () => {
  let s = withDie(mk(), 5);
  assert.equal(s.result!.chosen!.length, 3);
  assert.equal(new Set(s.result!.chosen).size, 3);
  assert.match(s.result!.text, /mag met een kind naar keuze ruilen/);
  s = R.primary(s, 100);
  assert.equal(s.phase, 'question');
  assert.deepEqual(s.questionKids, s.result!.chosen);
  assert.equal(R.timeLeftMs(s, 100), s.question!.tijd * 1000);
  s = R.primary(s, 200);
  assert.equal(s.phase, 'answer');
  s = R.primary(s, 300);
  assert.equal(s.phase, 'ready');
  assert.equal(s.round, 2);
});

test('worp 6 Sinterklaas: tv loot 3 kinderen die met iedereen mogen ruilen', () => {
  const s = withDie(mk(), 6);
  assert.equal(s.result!.chosen!.length, 3);
  assert.equal(new Set(s.result!.chosen).size, 3);
  assert.match(s.result!.text, /IEDEREEN/);
  assert.equal(R.primary(s, 0).phase, 'ready');
});

test('weinig kinderen: kiest hoogstens zoveel als er zijn', () => {
  const s = withDie(mk(3), 6);
  assert.equal(new Set(s.result!.chosen).size, 3);
});

test('elke 2 rondes volgt een Pietenvraag (niet dubbel als worp 5 net een vraag was)', () => {
  let s = mk(12, 3, 6);
  let now = 0;
  const qRounds: number[] = [];
  for (let step = 0; step < 200 && s.phase !== 'finale' && s.phase !== 'done'; step++) {
    now += 3000;
    const before = s.phase;
    if (s.phase === 'ready') s = withDie(s, 1); // altijd links: dus geen worp-5-vraag
    else s = R.primary(s, now);
    if (s.phase === 'question' && before !== 'question') qRounds.push(s.round);
    if (s.phase === 'finaleCountdown') break;
  }
  assert.deepEqual(qRounds, [2, 4, 6]);
  // met worp 5 in ronde 2 komt er geen tweede vraag
  let t = mk(12, 4, 4);
  t = R.primary(withDie(t, 1), 0); // ronde 1 klaar
  assert.equal(t.round, 2);
  t = withDie(t, 5);
  t = R.primary(t, 0); // vraag
  t = R.primary(t, 0); // antwoord
  t = R.primary(t, 0); // einde ronde 2: geen extra vraag
  assert.equal(t.phase, 'ready');
  assert.equal(t.round, 3);
});

test('dobbelen: niet dubbel en pas na de animatie', () => {
  let s = mk();
  const r = R.roll(s, 1000);
  assert.equal(r.phase, 'rolling');
  assert.equal(R.roll(r, 1001), r);
  assert.equal(R.primary(r, 1002), r);
  assert.equal(R.tick(r, 1000 + ROLL_MS - 1), r);
  assert.equal(R.tick(r, 1000 + ROLL_MS).phase, 'result');
});

test('finale: aftellen 5-4-3-2-1, dan "Het pakje dat je nu vasthoudt is van jou!" (finale), dan klaar', () => {
  let s = mk(8, 2, 2);
  s = R.primary(withDie(s, 1), 0);
  s = R.primary(withDie(s, 1), 0); // ronde 2 resultaat -> vraag (om de 2 rondes)
  assert.equal(s.phase, 'question');
  s = R.primary(R.primary(s, 0), 0);
  assert.equal(s.phase, 'finaleCountdown');
  assert.equal(s.countdown, 5);
  const seen: number[] = [s.countdown];
  let now = 0;
  while (s.phase === 'finaleCountdown') { now += 1000; s = R.tick(s, now); if (s.phase === 'finaleCountdown') seen.push(s.countdown); }
  assert.deepEqual(seen, [5, 4, 3, 2, 1]);
  assert.equal(s.phase, 'finale');
  assert.equal(R.primary(s, 0).phase, 'done');
});

test('timer in de Pietenvraag: +15 sec en pauze', () => {
  let s = R.primary(withDie(mk(), 5), 0);
  const t0 = s.question!.tijd * 1000;
  s = R.addTime(s, 5_000);
  assert.equal(R.timeLeftMs(s, 5_000), t0 - 5_000 + 15_000);
  s = R.togglePause(s, 5_000);
  assert.equal(R.timeLeftMs(s, 50_000), t0 + 10_000);
  s = R.togglePause(s, 60_000);
  assert.equal(R.timeLeftMs(s, 61_000), t0 + 9_000);
  const sk = R.skipQuestion(s, 70_000);
  assert.notEqual(sk.question!.id, s.question!.id);
});

test('volledige spellen (3-40 kinderen, 10 rondes): regels gelden, geen vraag dubbel, spel eindigt', () => {
  for (let seed = 1; seed <= 50; seed++) {
    const n = [3, 4, 7, 12, 24, 30, 33, 40][seed % 8];
    let s = mk(n, seed, 10, seed % 2 === 0);
    let now = 0;
    const dice: number[] = [];
    for (let step = 0; step < 2000 && s.phase !== 'done'; step++) {
      now += 2000;
      s = s.phase === 'rolling' ? R.tick(s, now + ROLL_MS) : s.phase === 'finaleCountdown' ? R.tick(s, s.countdownEndsAt) : R.primary(s, now);
      assert.deepEqual(R.checkResult(s), [], `seed ${seed}`);
      if (s.phase === 'result') dice.push(s.result!.die);
    }
    assert.equal(s.phase, 'done', `seed ${seed}`);
    assert.equal(dice.length, 10);
    assert.equal(new Set(s.usedQ).size, s.usedQ.length);
  }
});
