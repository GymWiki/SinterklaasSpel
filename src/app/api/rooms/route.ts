import { getDb } from '@/db/client';
import { rooms } from '@/db/schema';
import { hashPin, json, newRoomId } from '@/lib/server/rooms';
import { MAX_PLAYERS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

/** Spel aanmaken: { hostPin, players: string[] } -> { id } */
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Ongeldige aanvraag.' }, 400);
  }
  const pin = String(body?.hostPin ?? '').trim();
  if (pin.length < 4 || pin.length > 32) return json({ error: 'Kies een pincode van minimaal 4 tekens.' }, 400);

  const raw: unknown[] = Array.isArray(body?.players) ? body.players : [];
  const players: string[] = [];
  for (const p of raw) {
    const name = String(p ?? '').trim().replace(/\s+/g, ' ').slice(0, 24);
    if (name && !players.some((x) => x.toLowerCase() === name.toLowerCase())) players.push(name);
  }
  if (players.length < 3) return json({ error: 'Vul minimaal 3 spelers in (jezelf meegeteld).' }, 400);
  if (players.length > MAX_PLAYERS) return json({ error: `Maximaal ${MAX_PLAYERS} spelers.` }, 400);

  const db = await getDb();
  for (let i = 0; i < 5; i++) {
    const id = newRoomId();
    try {
      await db.insert(rooms).values({ id, hostPin: hashPin(id, pin), players: JSON.stringify(players) });
      return json({ id }, 201);
    } catch (e: any) {
      if (!/UNIQUE|constraint/i.test(String(e?.message))) throw e;
    }
  }
  return json({ error: 'Kon geen kamercode maken, probeer opnieuw.' }, 500);
}
