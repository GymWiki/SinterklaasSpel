import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from './engine';
import { GENERAL_TARGET } from '../lib/constants';
import type { GameState, Submission } from './types';

const names = ['Sander', 'Lisa', 'Tim', 'Noor', 'Daan', 'Emma'];
const subs = (n: number): Submission[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `s${i}`, authorName: names[i % 6], targetPlayerName: i % 7 === 0 ? GENERAL_TARGET : names[(i * 5) % 3 === 0 ? 1 : (i + 2) % 6],
    type: i % 3 === 0 ? 'poem' : 'secret', content: `Inzending nummer ${i} met genoeg tekst.`,
  }));

function play(s: GameState, now: number, die?: number) {
  s = E.roll(s, now, die);
  now += 3000;
  s = E.tick(s, now);
  return { s, now };
}

test('zitkring: links = volgende index, rechts = vorige, tegenover = helft verder', () => {
  const s = E.createState('X', names, []);
  const c = E.seatContext(s, s.players[0].id);
  assert.equal(c.L.name, 'Lisa');
  assert.equal(c.R.name, 'Emma');
  assert.equal(c.O.name, 'Noor');
});

test('gepauzeerde spelers worden overgeslagen', () => {
  let s = E.createState('X', names, []);
  s = E.setPaused(s, s.players[1].id, true);
  assert.equal(E.nextActiveId(s, s.players[0].id), s.players[2].id);
  const c = E.seatContext(s, s.players[0].id);
  assert.equal(c.L.name, 'Tim');
});

test('ronde 1: gooi -> taak -> volgende; dubbelklik wordt genegeerd', () => {
  let s = E.createState('X', names, []);
  let now = 1_000;
  s = E.startRound1(s, now);
  const a = E.roll(s, now, 1);
  assert.equal(a.turn!.stage, 'rolling');
  assert.equal(E.roll(a, now + 10, 2), a); // anti-dubbelklik
  assert.equal(E.next(a, now + 100), a);
  now += 2000;
  const b = E.tick(a, now);
  assert.equal(b.turn!.stage, 'task');
  assert.equal(E.next(b, now + 100), b); // te snel na de taak
  const c = E.next(b, now + 1000);
  assert.equal(c.turn!.activeId, s.players[1].id);
});

test('ronde 1: 6 vaste uitkomsten met pijlen bij 2 (links) en 4 (rechts)', () => {
  const s0 = E.startRound1(E.createState('X', names, []), 0);
  const kinds: Record<number, string> = { 1: 'unwrap', 2: 'shift', 3: 'steal', 4: 'shift', 5: 'give', 6: 'party' };
  for (let die = 1; die <= 6; die++) {
    const r = play(s0, 0, die);
    const t = r.s.turn!.task!;
    assert.equal(t.kind, kinds[die]);
    assert.equal(t.arrow, die === 2 ? 'cw' : die === 4 ? 'ccw' : undefined);
    assert.equal(t.timerSec, undefined);
  }
  assert.match(play(s0, 0, 1).s.turn!.task!.main.tpl, /NOG NIET uit/);
  assert.match(play(s0, 0, 3).s.turn!.task!.sub!.tpl, /zonder uit te pakken/);
  assert.match(play(s0, 0, 5).s.turn!.task!.sub!.tpl, /gaat de beurt naar de volgende persoon/);
});

test('jongste speler begint; zonder keuze begint de host', () => {
  let s = E.createState('X', names, []);
  assert.equal(E.startRound1(s, 0).turn!.activeId, s.players[0].id);
  s = E.setYoungest(s, s.players[3].id);
  assert.equal(E.startRound1(s, 0).turn!.activeId, s.players[3].id);
  assert.equal(E.setYoungest(s, s.players[3].id).youngestId, null); // nogmaals tikken = uit
  const s2 = E.startRound1(s, 0);
  assert.equal(E.setYoungest(s2, s2.players[1].id), s2); // alleen in de lobby
});

test('uitpak-moment tussen ronde 1 en 2: klok start pas daarna', () => {
  let s = E.startRound1(E.createState('X', names, []), 0);
  s = E.startUnwrap(s, 1000);
  assert.equal(s.phase, 'unwrap');
  assert.equal(s.r2, null);
  assert.equal(E.roll(s, 1100), s);
  s = E.startRound2(s, 5000);
  assert.equal(s.phase, 'round2');
  assert.ok(s.r2!.startAt === 5000);
});

test('slotjes schalen mee en verhuizen', () => {
  let s = E.createState('X', names, subs(0)); // 6 spelers -> max 2
  s = E.startRound1(s, 0);
  s = E.startRound2(s, 0);
  assert.equal(E.maxLocks(s), 2);
  let now = 0;
  for (let i = 0; i < 6; i++) {
    for (let k = 0; k < 40 && !(s.locks.includes(s.turn!.activeId)); k++) {
      // gooi 4 tot we een kluis hebben
      const r = play(s, now, 4);
      s = r.s; now = r.now;
      if (s.turn!.task!.kind !== 'vault') { s = E.next(s, now + 1000); now += 2000; }
    }
    assert.ok(s.locks.length <= 2);
    s = E.next(s, now + 1000); now += 2000;
  }
});

test('stoelendans wisselt namen en laat slotje bij de stoel', () => {
  let s = E.startRound2(E.startRound1(E.createState('X', names, []), 0), 0);
  s = { ...s, locks: [s.players[0].id] };
  const before = s.players.map((p) => p.id);
  let now = 0;
  let found = false;
  for (let i = 0; i < 300 && !found; i++) {
    const r = play(s, now, 5);
    s = r.s; now = r.now;
    const t = s.turn!.task!;
    if (t.kind === 'chairs') {
      const after = s.players.map((p) => p.id);
      assert.equal(new Set(after).size, before.length);
      assert.notDeepEqual(after, before);
      // het slotje zit nog steeds op dezelfde stoel (index 0)
      assert.equal(s.locks[0], after[0]);
      found = true;
    } else {
      s = E.next(s, now + 1000);
      now += 2000;
    }
  }
  assert.ok(found);
});

test('Grote Boek: eerst inzendingen, nooit 3x dezelfde schuldige, daarna ingebouwde vragen', () => {
  const many: Submission[] = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, authorName: 'Tim', targetPlayerName: 'Lisa', type: 'secret', content: `Alles over Lisa ${i} en meer` }));
  let s = E.startRound2(E.startRound1(E.createState('X', names, many), 0), 0);
  let now = 0;
  const seen: string[] = [];
  for (let i = 0; i < 5; i++) {
    const r = play(s, now, 6);
    s = r.s; now = r.now;
    const card = s.turn!.task!.book!.card;
    seen.push(card.source === 'submission' ? card.target! : '-');
    now += 4000;
    s = E.revealBook(s, now);
    assert.equal(s.turn!.task!.book!.stage, 'revealed');
    s = E.next(s, now + 1000); now += 2000;
  }
  // nooit drie keer Lisa achter elkaar
  for (let i = 2; i < seen.length; i++) assert.ok(!(seen[i] === 'Lisa' && seen[i - 1] === 'Lisa' && seen[i - 2] === 'Lisa'), seen.join());
  assert.ok(seen.includes('-'));
});

test('boek-onthulling pas na tromgeroffel; Volgende pas na onthulling', () => {
  let s = E.startRound2(E.startRound1(E.createState('X', names, subs(4)), 0), 0);
  const r = play(s, 0, 6);
  s = r.s;
  const t0 = r.now;
  assert.equal(E.revealBook(s, t0 + 100), s);
  assert.equal(E.canNext(s, t0 + 5000), false);
  const rev = E.revealBook(s, t0 + 4000);
  assert.equal(E.canNext(rev, t0 + 5000), true);
});

test('einde: onzichtbare klok, tension, vals alarm, turbo, finish', () => {
  let s = E.startRound2(E.startRound1(E.createState('X', names, []), 0), 0);
  const { endAt, falseAlarmAt } = s.r2!;
  assert.ok(endAt >= 30 * 60000 * 0.87 - 1 && endAt <= 30 * 60000 * 1.13 + 1);
  assert.ok(falseAlarmAt < endAt);
  s = E.tick(s, endAt - E.TENSION_MS + 1);
  assert.ok(s.r2!.tensionStarted);
  assert.ok(s.turn!.deadline);
  assert.equal(E.inTurbo(s, endAt - E.TURBO_MS + 1), true);
  s = E.tick(s, falseAlarmAt + 1);
  assert.ok(s.r2!.falseAlarmDone);
  assert.equal(s.phase, 'round2');
  s = E.tick(s, endAt + 1);
  assert.equal(s.phase, 'finished');
  assert.equal(E.roll(s, endAt + 2), s); // dobbelknop geblokkeerd
});

test('Schiet-op-Piet: na 25s rolt de dobbelsteen vanzelf', () => {
  let s = E.startRound2(E.startRound1(E.createState('X', names, []), 0), 0);
  const t = s.r2!.endAt - E.TENSION_MS + 10;
  s = E.tick(s, t);
  s = E.tick(s, t + E.TURN_LIMIT_MS + 1);
  assert.equal(s.turn!.stage, 'rolling');
});

test('volledige simulatie van 400 beurten crasht niet en houdt invarianten', () => {
  let s = E.startRound1(E.createState('X', names, subs(10)), 0);
  let now = 0;
  for (let i = 0; i < 400; i++) {
    if (i === 60) s = E.startRound2(s, now);
    const r = play(s, now);
    s = r.s; now = r.now + 1500;
    if (s.turn?.task?.book) { s = E.revealBook(s, now + 4000); now += 4000; }
    s = E.next(s, now);
    now += 1000;
    assert.equal(new Set(s.players.map((p) => p.id)).size, 6);
    assert.ok(s.locks.length <= E.maxLocks(s));
    assert.ok(s.phase !== 'finished' || i > 0);
    if (s.phase === 'finished') break;
    if (s.r2) now = Math.min(now, s.r2.endAt - 60_000 * 6);
  }
});
