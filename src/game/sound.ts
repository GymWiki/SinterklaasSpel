'use client';
import type { FxName } from './types';

export type MusicMode = 'off' | 'calm' | 'lively' | 'tense';

const PENTA = [0, 2, 4, 7, 9];
const MINOR = [0, 3, 5, 7, 10];
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/** Alle geluiden worden live gesynthetiseerd met WebAudio: geen audiobestanden nodig. */
class Sfx {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  muted = false;
  private mode: MusicMode = 'off';
  private step = 0;
  private nextT = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  get ready() {
    return !!this.ctx && this.ctx.state === 'running';
  }

  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.8;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state !== 'running') this.ctx.resume();
      return true;
    } catch {
      return false;
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.8;
  }

  private tone(f: number, dur: number, type: OscillatorType = 'sine', vol = 0.2, when = 0, slideTo?: number, lp?: number) {
    const c = this.ctx;
    if (!c || !this.master) return;
    const t = c.currentTime + when;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.02, dur / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node: AudioNode = o;
    if (lp) {
      const fl = c.createBiquadFilter();
      fl.type = 'lowpass';
      fl.frequency.value = lp;
      o.connect(fl);
      node = fl;
    }
    node.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private noise(dur: number, vol = 0.2, when = 0, freq = 1500, type: BiquadFilterType = 'bandpass') {
    const c = this.ctx;
    if (!c || !this.master) return;
    const t = c.currentTime + when;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const fl = c.createBiquadFilter();
    fl.type = type;
    fl.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(fl).connect(g).connect(this.master);
    src.start(t);
  }

  private horn(dur: number, base = 110, vol = 0.22) {
    // stoomboot-hoorn: drie gestapelde zaagtanden met lichte vibrato en lage cutoff
    [1, 1.25, 1.5].forEach((m, i) => this.tone(base * m, dur, 'sawtooth', vol / (1 + i * 0.4), 0, base * m * 0.97, 700));
    this.tone(base / 2, dur, 'sine', vol, 0);
  }

  private fanfare(when = 0) {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.28, 'triangle', 0.2, when + i * 0.14));
    this.tone(1047, 0.7, 'triangle', 0.22, when + 0.6);
    this.tone(784, 0.7, 'triangle', 0.16, when + 0.6);
  }

  play(name: FxName) {
    if (!this.ready) return;
    switch (name) {
      case 'start':
      case 'round2':
        this.fanfare();
        break;
      case 'dice':
        for (let i = 0; i < 14; i++) this.noise(0.05, 0.25, i * 0.04 + i * i * 0.004, 2500 + Math.random() * 2500);
        break;
      case 'reveal':
        this.tone(660, 0.12, 'triangle', 0.2);
        this.tone(880, 0.2, 'triangle', 0.2, 0.1);
        break;
      case 'drum':
        for (let i = 0; i < 70; i++) {
          const w = i * 0.038;
          this.noise(0.05, 0.1 + (i / 70) * 0.25, w, 220, 'lowpass');
          if (i % 2 === 0) this.tone(90, 0.06, 'sine', 0.18, w);
        }
        this.noise(0.9, 0.3, 2.7, 6000, 'highpass');
        this.tone(70, 0.5, 'sine', 0.35, 2.7);
        break;
      case 'bookreveal':
        this.fanfare();
        this.noise(0.5, 0.15, 0, 5000, 'highpass');
        break;
      case 'swap':
        for (let i = 0; i < 6; i++) this.tone(300 + (i % 2) * 220, 0.1, 'square', 0.1, i * 0.09);
        break;
      case 'lock':
        this.tone(1200, 0.06, 'square', 0.15);
        this.tone(1800, 0.4, 'triangle', 0.18, 0.08);
        break;
      case 'mijter':
        [392, 494, 587].forEach((f) => this.tone(f, 0.8, 'triangle', 0.14));
        break;
      case 'shift':
        this.noise(0.9, 0.22, 0, 800, 'bandpass');
        this.tone(200, 0.9, 'sine', 0.12, 0, 600);
        break;
      case 'reverse':
        this.tone(700, 0.35, 'sawtooth', 0.1, 0, 200, 1500);
        this.tone(200, 0.35, 'sawtooth', 0.1, 0.35, 700, 1500);
        break;
      case 'timerEnd':
        this.tone(220, 0.7, 'sawtooth', 0.22, 0, 180, 1200);
        break;
      case 'tension':
        for (let i = 0; i < 3; i++) this.tone(60, 0.5, 'sine', 0.4, i * 0.7);
        break;
      case 'falseAlarm':
        this.horn(0.9, 196, 0.2);
        break;
      case 'piet':
        for (let i = 0; i < 4; i++) this.tone(880, 0.1, 'square', 0.12, i * 0.14);
        break;
      case 'horn':
        this.horn(4, 98, 0.3);
        this.fanfare(3.2);
        break;
      case 'next':
        this.tone(440, 0.08, 'sine', 0.12);
        break;
    }
  }

  /** Aftel-piepjes (per seconde). */
  tick(secondsLeft: number, urgent = false) {
    if (!this.ready) return;
    const low = secondsLeft <= 3;
    this.tone(low || urgent ? 1000 : 700, low ? 0.18 : 0.07, 'square', low ? 0.16 : 0.09);
  }

  setMusic(mode: MusicMode) {
    if (mode === this.mode) return;
    this.mode = mode;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (mode === 'off' || !this.ctx) return;
    this.step = 0;
    this.nextT = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 100);
  }

  private schedule() {
    const c = this.ctx;
    if (!c || this.mode === 'off' || !this.ready) return;
    const bpm = this.mode === 'calm' ? 96 : this.mode === 'lively' ? 128 : 152;
    const stepDur = 60 / bpm / 2;
    const scale = this.mode === 'tense' ? MINOR : PENTA;
    const root = this.mode === 'tense' ? 57 : 60;
    while (this.nextT < c.currentTime + 0.4) {
      const w = this.nextT - c.currentTime;
      const i = this.step++;
      const deg = scale[(i * 3 + (i >> 2)) % scale.length];
      const oct = i % 8 < 4 ? 0 : 12;
      const vol = this.mode === 'tense' ? 0.05 : 0.04;
      this.tone(mtof(root + deg + oct), stepDur * 0.9, this.mode === 'tense' ? 'square' : 'triangle', vol, w, undefined, 2500);
      if (i % 2 === 0) this.tone(mtof(root - 12 + scale[(i >> 1) % 3]), stepDur * 1.6, 'sine', 0.07, w);
      if (this.mode === 'tense') this.noise(0.03, 0.05, w, 6000, 'highpass');
      this.nextT += stepDur;
    }
  }
}

export const sfx = new Sfx();
