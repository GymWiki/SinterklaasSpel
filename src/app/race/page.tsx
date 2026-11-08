'use client';
import './race.css';
import { Start } from '@/race/ui/Start';
import { RaceGameView } from '@/race/ui/RaceGameView';
import { useRace } from '@/race/store';

export default function RacePage() {
  const race = useRace();
  if (!race.loaded) return <main className="rs"><p>Laden...</p></main>;
  if (!race.game) return <Start onStart={race.start} />;
  return <RaceGameView race={race} game={race.game} />;
}
