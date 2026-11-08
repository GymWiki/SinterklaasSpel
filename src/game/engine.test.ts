import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from './engine';
import { GENERAL_TARGET } from '../lib/constants';
import { FEATURES } from '../lib/features';
import { DECK } from '../content/deck';
import { CHAOS } from '../content/round3';
import type { GameState, Submission } from './types';

const names = ['Sander', 'Lisa', 'Tim', 'Noor', 'Daan', 'Emma'];
const mk = (n = names) => E.createState('X', n, []);
const toR2 = (s: GameState, now = 0) => E.startRound2(E.startRound1(s, now), now);
const toR3 = (s: GameState, now = 0) => E.startRound3(toR2(s, now), now);

function play(s: GameState, now: number, die?: number) {
  s = E.roll(s, now, die);
  now += 3000;
  s = E.tick(s, now);
  return { s, now };
}
const task = (s: GameState, die: number) => play(s, 0, die).s.turn!.task!;

test('zitkring: links = volgende index, rechts = vorige, tegenover = helft verder', () => {
  const s = mk();
  const c = E.seatContext(s, s.players[0].id);
  assert.equal(c.L.name, 'Lisa');
  assert.equal(c.R.name, 'Emma');
  assert.equal(c.O.name, 'Noor');
});

test('gepauzeerde spelers worden overgeslagen', () => {
  let s = mk();
  s = E.setPaused(s, s.players[1].id, true);
  assert.equal(E.nextActiveId(s, s.players[0].id), s.players[2].id);
  assert.equal(E.seatContext(s, s.players[0].id).L.name, 'Tim');
});

test('jongste speler begint; zonder keuze begint de host', () => {
  let s = mk();
  assert.equal(E.startRound1(s, 0).turn!.activeId, s.players[0].id);
  s = E.setYoungest(s, s.players[3].id);
  assert.equal(E.startRound1(s, 0).turn!.activeId, s.players[3].id);
  assert.equal(E.setYoungest(s, s.players[3].id).youngestId, null);
  const s2 = E.startRound1(s, 0);
  assert.equal(E.setYoungest(s2, s2.players[1].id), s2);
});

test('anti-dubbelklik: gooien, volgende en te snel doorklikken', () => {
  let s = E.startRound1(mk(), 1000);
  const a = E.roll(s, 1000, 1);
  assert.equal(a.turn!.stage, 'rolling');
  assert.equal(E.roll(a, 1010, 2), a);
  assert.equal(E.next(a, 1100), a);
  const b = E.tick(a, 3000);
  assert.equal(b.turn!.stage, 'task');
  assert.equal(E.next(b, 3100), b);
  assert.equal(E.next(b, 4000).turn!.activeId, s.players[1].id);
});

test('ronde 1: exact 6 vaste uitkomsten, pijlen bij 2 (links) en 4 (rechts), nooit een timer', () => {
  const s0 = E.startRound1(mk(), 0);
  const kinds: Record<number, string> = { 1: 'unwrap', 2: 'shift', 3: 'steal', 4: 'shift', 5: 'give', 6: 'party' };
  for (let die = 1; die <= 6; die++) {
    for (let k = 0; k < 5; k++) {
      const t = task(s0, die);
      assert.equal(t.kind, kinds[die]);
      assert.equal(t.arrow, die === 2 ? 'cw' : die === 4 ? 'ccw' : undefined);
      assert.equal(t.timerSec, undefined);
    }
  }
  assert.match(task(s0, 1).main.tpl, /pakken! Let op: pak het cadeautje NOG NIET uit/);
  assert.match(task(s0, 2).main.tpl, /één cadeau aan de persoon LINKS/);
  assert.match(task(s0, 3).sub!.tpl, /zonder uit te pakken/);
  assert.match(task(s0, 4).main.tpl, /één cadeau aan de persoon RECHTS/);
  assert.match(task(s0, 5).sub!.tpl, /Dan gaat de beurt voorbij/);
  assert.match(task(s0, 6).main.tpl, /pakken én het meteen uitpakken/);
});

test('3 rondes: 1 -> 2 (geen klok) -> 3 (geheime klok)', () => {
  let s = E.startRound1(mk(), 0);
  s = E.startRound2(s, 1000);
  assert.equal(s.phase, 'round2');
  assert.equal(s.r3, null);
  assert.equal(E.tick(s, 10 * 3600_000).phase, 'round2');
  assert.equal(E.startRound2(s, 2000), s);
  assert.equal(E.startRound3(E.startRound1(mk(), 0), 5000).phase, 'round1'); // eerst ronde 2
  s = E.startRound3(s, 5000);
  assert.equal(s.phase, 'round3');
  assert.equal(s.r3!.startAt, 5000);
});

test('ronde 2: vaste rustige regels, alleen gooi 4 is een opdracht', () => {
  const s0 = toR2(mk());
  for (const d of [1, 6]) {
    const t = task(s0, d);
    assert.equal(t.kind, 'unwrap');
    assert.match(t.main.tpl, /één van je eigen nog ingepakte cadeaus uitpakken/);
    assert.match(t.sub!.tpl, /bij iemand anders uit én ruil/);
  }
  const n = task(s0, 2);
  assert.equal(n.kind, 'neighbor');
  assert.match(n.main.tpl, /\{L\} of \{R\}/);
  const o = task(s0, 3);
  assert.equal(o.kind, 'opposite');
  assert.match(o.main.tpl, /\{O\} \(recht tegenover je\)/);
  const b = task(s0, 5);
  assert.equal(b.kind, 'balance');
  assert.match(b.main.tpl, /MEESTE/);
  assert.match(b.sub!.tpl, /eigen ingepakte cadeaus uit/);
  for (let i = 0; i < 20; i++) assert.equal(task(s0, 4).kind, 'deck');
  for (const d of [1, 2, 3, 5, 6]) assert.notEqual(task(s0, d).kind, 'deck');
});

test('opdrachten-deck: 50 kaarten, Smart Deck zonder herhaling, gedeeld door ronde 2 en 3', () => {
  assert.equal(DECK.length, 50);
  let s = toR2(mk());
  const seen: string[] = [];
  let now = 0;
  for (let i = 0; i < 50; i++) {
    const r = play(s, now, 4);
    s = r.s; now = r.now;
    seen.push(s.turn!.task!.main.tpl);
    if (i === 24) s = E.startRound3(E.next(s, now + 1000), now);
    else s = E.next(s, now + 1000);
    now += 2000;
  }
  assert.equal(new Set(seen).size, 50);
});

test('deck-timer start niet vanzelf: pas na "Start klok" met 3-2-1 aftelling', () => {
  const s0 = toR2(mk());
  let found: GameState | null = null;
  for (let i = 0; i < 60 && !found; i++) {
    const r = play(s0, 0, 4);
    if (r.s.turn!.task!.timerSec) found = r.s;
  }
  assert.ok(found);
  const t0 = found!.turn!;
  assert.equal(t0.timerEndsAt, null);
  assert.equal(E.tick(found!, 60_000).turn!.timerDone, false);
  const st = E.startTimer(found!, 10_000);
  assert.equal(st.turn!.timerStartsAt, 10_000 + E.COUNTDOWN_MS);
  assert.equal(st.turn!.timerEndsAt, 10_000 + E.COUNTDOWN_MS + t0.task!.timerSec! * 1000);
  assert.equal(E.startTimer(st, 11_000), st);
  assert.equal(E.tick(st, st.turn!.timerEndsAt! + 1).turn!.timerDone, true);
});

test('ronde 3: vaste categorie per getal', () => {
  const s0 = toR3(mk());
  const kinds = (die: number) => new Set(Array.from({ length: 60 }, () => task(s0, die).kind));
  assert.deepEqual([...kinds(1)], ['steal']);
  assert.deepEqual([...kinds(2)], ['shift']);
  assert.deepEqual([...kinds(3)].sort(), ['mijter', 'vault']);
  assert.deepEqual([...kinds(4)], ['deck']);
  assert.deepEqual([...kinds(5)], ['reverse']);
  const k6 = kinds(6);
  assert.ok(![...k6].includes('book'));
  assert.ok(k6.has('chairs') && k6.has('chaos'));
  // herinnering onderaan bij 1 en 2
  assert.match(task(s0, 1).foot!, /Kluis zijn veilig.*Mijter is immuun/);
  assert.match(task(s0, 2).foot!, /Kluis zijn veilig/);
  assert.equal(task(s0, 3).foot, undefined);
  // gooi 1 is meestal de simpele variant
  const t1 = Array.from({ length: 60 }, () => task(s0, 1).main.tpl);
  assert.ok(t1.filter((x) => /bij iemand anders in de kamer/.test(x)).length > 30);
  assert.ok(t1.some((x) => /\{L\} of \{R\}/.test(x)) && t1.some((x) => /\{O\}/.test(x)));
});

test('ronde 3 groeps-schuif: kleinste/grootste/keuze, pijl mee met de speelrichting', () => {
  const s0 = toR3(mk());
  const txt = new Set(Array.from({ length: 30 }, () => task(s0, 2).main.tpl.match(/KLEINSTE|GROOTSTE|KEUZE/)![0]));
  assert.equal(txt.size, 3);
  assert.equal(task(s0, 2).arrow, 'cw');
  assert.equal(task({ ...s0, direction: -1 }, 2).arrow, 'ccw');
});

test('ronde 3 richting omdraaien: direction flipt + ruil met directe buurman', () => {
  const s0 = toR3(mk());
  const r = play(s0, 0, 5).s;
  assert.equal(r.direction, -1);
  assert.match(r.turn!.task!.main.tpl, /ruil één cadeau met een directe buurman: \{L\} of \{R\}/);
  assert.equal(r.turn!.task!.arrow, 'ccw');
});

test('chaos-deck: 6 kaarten, geen herhaling binnen een rondje, effecten worden uitgevoerd', () => {
  assert.equal(CHAOS.length, 6);
  let s = toR3(mk());
  s = { ...s, locks: [s.players[2].id], mijter: s.players[3].id };
  let now = 0;
  const seen: string[] = [];
  for (let i = 0; i < 6; i++) {
    const before = s.players.map((p) => p.id);
    const active = s.turn!.activeId;
    const r = play(s, now, 6);
    s = r.s; now = r.now;
    const t = s.turn!.task!;
    const card = CHAOS.find((c) => c.t === t.main.tpl)!;
    seen.push(card.title);
    const after = s.players.map((p) => p.id);
    if (card.effect === 'SWAP_SEATS_TARGET' || card.effect === 'SWAP_SEATS_OPPOSITE') {
      assert.equal(after.filter((id, k) => id !== before[k]).length, 2);
      assert.equal(t.main.slots.A, active);
    } else assert.deepEqual(after, before);
    if (card.effect === 'CLEAR_VAULTS') assert.deepEqual(s.locks, []);
    if (card.effect === 'CLAIM_MITRE') assert.equal(s.mijter, active);
    s = E.next(s, now + 1000);
    now += 2000;
  }
  assert.equal(new Set(seen).size, 6);
});

test('stoelendans laat het slotje bij de stoel', () => {
  let s = toR3(mk());
  s = { ...s, locks: [s.players[0].id] };
  const before = s.players.map((p) => p.id);
  let now = 0;
  let found = false;
  for (let i = 0; i < 80 && !found; i++) {
    const r = play(s, now, 6);
    s = r.s; now = r.now;
    if (s.turn!.task!.kind === 'chairs') {
      const after = s.players.map((p) => p.id);
      if (after[0] !== before[0] || s.locks.length) assert.equal(s.locks[0], after[0]);
      found = true;
    } else { s = E.next(s, now + 1000); now += 2000; if (s.locks.length === 0) break; }
  }
  assert.ok(found || s.locks.length === 0);
});

test('slotjes: 1 per 3 spelers, verhuizen als alles bezet is', () => {
  let s = toR3(mk());
  assert.equal(E.maxLocks(s), 2);
  let now = 0, guard = 0;
  while (s.locks.length < 2 && guard++ < 300) {
    const r = play(s, now, 3); s = r.s; now = r.now;
    s = E.next(s, now + 1000); now += 2000;
  }
  assert.equal(s.locks.length, 2);
  let moved = false;
  for (let i = 0; i < 300 && !moved; i++) {
    const expectedOld = s.locks[0];
    const r = play(s, now, 3); s = r.s; now = r.now;
    const t = s.turn!.task!;
    if (t.kind === 'vault' && t.sub!.tpl.includes('verhuist')) {
      assert.equal(t.sub!.slots.OLD, expectedOld);
      assert.ok(!s.locks.includes(expectedOld) || s.turn!.activeId === expectedOld);
      assert.ok(s.locks.includes(s.turn!.activeId));
      moved = true;
    }
    s = E.next(s, now + 1000); now += 2000;
  }
  assert.ok(moved);
  assert.ok(s.locks.length <= 2);
});

test('mijter is immuun: duel-tegenstander is nooit de mijter-houder (ronde 3)', () => {
  let s = toR3(mk());
  const holder = s.players[1].id;
  s = { ...s, mijter: holder };
  for (let i = 0; i < 150; i++) {
    const t = task(s, 4);
    if (t.main.slots.X === holder) assert.fail('mijter-houder als tegenstander gekozen');
  }
});

test('einde: onzichtbare klok, tension, vals alarm, turbo, finish', () => {
  let s = toR3(mk());
  const { endAt, falseAlarmAt } = s.r3!;
  assert.ok(endAt >= 30 * 60000 * 0.87 - 1 && endAt <= 30 * 60000 * 1.13 + 1);
  assert.ok(falseAlarmAt < endAt);
  s = E.tick(s, endAt - E.TENSION_MS + 1);
  assert.ok(s.r3!.tensionStarted);
  assert.ok(s.turn!.deadline);
  assert.equal(E.inTurbo(s, endAt - E.TURBO_MS + 1), true);
  s = E.tick(s, falseAlarmAt + 1);
  assert.ok(s.r3!.falseAlarmDone);
  assert.equal(s.phase, 'round3');
  s = E.tick(s, endAt + 1);
  assert.equal(s.phase, 'finished');
  assert.equal(E.roll(s, endAt + 2), s);
});

test('Schiet-op-Piet: na 20s rolt de dobbelsteen vanzelf', () => {
  assert.equal(E.TURN_LIMIT_MS, 20_000);
  let s = toR3(mk());
  const t = s.r3!.endAt - E.TENSION_MS + 10;
  s = E.tick(s, t);
  s = E.tick(s, t + E.TURN_LIMIT_MS + 1);
  assert.equal(s.turn!.stage, 'rolling');
});

test('Grote Boek (feature-vlag aan): onthulling pas na tromgeroffel, nooit 3x dezelfde schuldige', () => {
  FEATURES.book = true;
  try {
    const many: Submission[] = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, authorName: 'Tim', targetPlayerName: i < 4 ? 'Lisa' : GENERAL_TARGET, type: 'secret', content: `Alles over Lisa ${i} en meer` }));
    let s = toR3(E.createState('X', names, many));
    let now = 0;
    const seen: string[] = [];
    for (let i = 0; i < 5; i++) {
      const r = play(s, now, 6);
      s = r.s; now = r.now;
      const b = s.turn!.task!.book!;
      assert.equal(E.revealBook(s, now + 100), s);
      seen.push(b.card.source === 'submission' ? b.card.target! : '-');
      now += 4000;
      s = E.revealBook(s, now);
      assert.equal(E.canNext(s, now + 1000), true);
      s = E.next(s, now + 1000);
      now += 2000;
    }
    for (let i = 2; i < seen.length; i++) assert.ok(!(seen[i] === 'Lisa' && seen[i - 1] === 'Lisa' && seen[i - 2] === 'Lisa'), seen.join());
  } finally {
    FEATURES.book = false;
  }
});

test('simulatie: 500 beurten door alle rondes crasht niet en houdt invarianten', () => {
  let s = E.startRound1(mk(), 0);
  let now = 0;
  for (let i = 0; i < 500; i++) {
    if (i === 40) s = E.startRound2(s, now);
    if (i === 100) s = E.startRound3(s, now);
    const r = play(s, now);
    s = r.s; now = r.now + 1500;
    s = E.next(s, now);
    now += 1000;
    assert.equal(new Set(s.players.map((p) => p.id)).size, 6);
    assert.ok(s.locks.length <= E.maxLocks(s));
    if (s.phase === 'finished') break;
    if (s.r3) now = Math.min(now, s.r3.endAt - 60_000 * 6);
  }
});
