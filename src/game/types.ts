import type { Audience } from '@/content/tags';

export interface Player {
  id: string;
  name: string;
  paused: boolean;
  color: string;
  icon: string;
}

export interface Submission {
  id: string;
  authorName: string;
  targetPlayerName: string;
  type: 'secret' | 'poem';
  content: string;
}

export type Phase = 'lobby' | 'round1' | 'unwrap' | 'round2' | 'finished';

/** Tekst met tokens ({A}, {L}...) + welke speler bij welk token hoort. */
export interface Rich {
  tpl: string;
  slots: Record<string, string>;
}

export type TaskKind =
  | 'unwrap' | 'give' | 'neighbor' | 'opposite' | 'mini' | 'bonus' | 'party'
  | 'steal' | 'bonus' | 'swap' | 'shift' | 'vault' | 'mijter' | 'reverse' | 'chairs' | 'book';

export interface BookCard {
  id: string;
  source: 'submission' | 'builtin';
  type: 'secret' | 'poem' | 'dilemma';
  content: string;
  /** spelernaam / GENERAL_TARGET / null (builtin) */
  target: string | null;
}

export interface Task {
  kind: TaskKind;
  title: string;
  emoji: string;
  main: Rich;
  sub?: Rich;
  timerSec?: number;
  arrow?: 'cw' | 'ccw';
  highlight?: string[];
  book?: {
    card: BookCard;
    stage: 'riddle' | 'revealed';
    drumUntil: number;
    reveal?: Rich;
    targetId?: string | null;
  };
}

export type Effect =
  | { t: 'lock'; id: string }
  | { t: 'mijter'; id: string }
  | { t: 'reverse' }
  | { t: 'again' }
  | { t: 'swap'; a: string; b: string }
  | { t: 'book'; cardId: string; source: 'submission' | 'builtin'; target: string | null };

export interface Turn {
  activeId: string;
  stage: 'ready' | 'rolling' | 'task';
  die: number | null;
  rollMs: number;
  revealAt: number;
  pending: { task: Task; effects: Effect[] } | null;
  task: Task | null;
  resolvedAt: number;
  timerEndsAt: number | null;
  timerDone: boolean;
  /** "Schiet-op-Piet" deadline voor de worp (alleen in de ontknoping) */
  deadline: number | null;
  startedAt: number;
  /** bonus-beurt: dezelfde speler gooit nog een keer */
  again?: boolean;
}

export interface DeckState {
  queue: number[];
  last: number | null;
}

export interface GameState {
  v: 1;
  rev: number;
  roomId: string;
  isDemo: boolean;
  phase: Phase;
  settings: { audience: Audience; r2Minutes: number };
  players: Player[];
  submissions: Submission[];
  removedIds: string[];
  loadedAt: number | null;
  direction: 1 | -1;
  locks: string[];
  mijter: string | null;
  turn: Turn | null;
  turnCount: number;
  decks: Record<string, DeckState>;
  /** jongste speler: begint met dobbelen in Ronde 1 */
  youngestId?: string | null;
  book: { queue: string[]; usedIds: string[]; lastTargets: string[]; fallback: DeckState };
  r2: { startAt: number; endAt: number; falseAlarmAt: number; falseAlarmDone: boolean; tensionStarted: boolean } | null;
  banner: { text: string; until: number } | null;
  fx: { id: number; name: FxName } | null;
}

export type FxName =
  | 'start' | 'dice' | 'reveal' | 'drum' | 'swap' | 'lock' | 'mijter' | 'shift' | 'reverse'
  | 'bookreveal' | 'timerEnd' | 'tension' | 'falseAlarm' | 'horn' | 'piet' | 'round2' | 'next';
