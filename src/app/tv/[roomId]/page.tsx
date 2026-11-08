'use client';
import { useParams } from 'next/navigation';
import { TvScreen } from '@/components/TvScreen';
import { useNow, useTvGame, useWakeLock } from '@/game/store';
import { useSoundDriver } from '@/game/useSound';

export default function TvPage() {
  const { roomId: raw } = useParams<{ roomId: string }>();
  const roomId = raw === 'demo' ? 'demo' : String(raw).toUpperCase();
  const { state, loaded } = useTvGame(roomId);
  const now = useNow(200);
  useWakeLock(true);
  useSoundDriver(state, now, true);

  if (!loaded) return <div className="tv-empty">Laden...</div>;
  if (!state)
    return (
      <div className="tv-empty">
        <h1>📺 Wachten op de host...</h1>
        <p>Open <b>/host/{roomId}</b> op dit apparaat (in een ander tabblad) en laad het spel. Dit scherm verbindt dan vanzelf.</p>
      </div>
    );
  return <TvScreen state={state} now={now} />;
}
