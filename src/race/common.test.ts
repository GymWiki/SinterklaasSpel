import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, drawQuestion, questionBank, rngNext, rngShuffle, rollDie, seedRng } from './common';

test('seedbare random: zelfde seed = zelfde reeks, verschillende seed = andere reeks', () => {
  const seq = (seed: number) => { let s = seedRng(seed); const out: number[] = []; for (let i = 0; i < 20; i++) { let v; [v, s] = rngNext(s); out.push(v); } return out; };
  assert.deepEqual(seq(42), seq(42));
  assert.notDeepEqual(seq(42), seq(43));
  assert.ok(seq(1).every((v) => v >= 0 && v < 1));
});

test('dobbelsteen: alleen 1-6 en ongeveer eerlijk verdeeld', () => {
  let s = seedRng(7);
  const c = [0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 6000; i++) { let d; [d, s] = rollDie(s); assert.ok(d >= 1 && d <= 6); c[d]++; }
  for (let d = 1; d <= 6; d++) assert.ok(c[d] > 850 && c[d] < 1150, `${d}: ${c[d]}`);
});

test('shuffle behoudt alle elementen en is deterministisch', () => {
  const [a] = rngShuffle(seedRng(3), [1, 2, 3, 4, 5, 6, 7, 8]);
  const [b] = rngShuffle(seedRng(3), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(a, b);
  assert.deepEqual([...a].sort(), [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('vragenbank: minimaal 25 vragen per niveau, volledig en met unieke ids', () => {
  for (const l of LEVELS) {
    const bank = questionBank(l.id);
    assert.ok(bank.length >= 25, `${l.id}: ${bank.length}`);
    assert.equal(new Set(bank.map((q) => q.id)).size, bank.length);
    assert.equal(new Set(bank.map((q) => q.tekst)).size, bank.length);
    for (const q of bank) {
      assert.ok(q.tekst.length > 5 && q.tijd >= 10 && q.tijd <= 60, q.id);
      assert.ok(['rijm', 'raadsel', 'reken', 'taal', 'kennis', 'beweging'].includes(q.type));
      if (q.type !== 'beweging') assert.ok(q.antwoord, `${q.id} mist antwoord`);
    }
    for (const t of ['rijm', 'raadsel', 'reken', 'taal', 'kennis', 'beweging']) assert.ok(bank.some((q) => q.type === t), `${l.id} mist ${t}`);
  }
});

test('vraag trekken: nooit een herhaling binnen één spel', () => {
  for (const l of LEVELS) {
    let used: string[] = [], rng = seedRng(11);
    const seen = new Set<string>();
    const n = questionBank(l.id).length;
    for (let i = 0; i < n; i++) { const r = drawQuestion(l.id, used, rng); assert.ok(!seen.has(r.q.id)); seen.add(r.q.id); used = r.used; rng = r.rng; }
    assert.equal(seen.size, n);
  }
});
