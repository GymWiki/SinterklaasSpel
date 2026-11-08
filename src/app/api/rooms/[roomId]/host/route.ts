import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { rooms, submissions } from '@/db/schema';
import { clearFails, json, normalizeRoomId, registerFail, tooManyFails, verifyPin } from '@/lib/server/rooms';

export const dynamic = 'force-dynamic';

/**
 * Fase 2: dé ene call waarmee de host de kamer + alle inzendingen ophaalt (pin vereist).
 * Wordt ook gebruikt door "Ververs inzendingen".
 */
export async function POST(req: Request, ctx: { params: Promise<{ roomId: string }> }) {
  const roomId = normalizeRoomId((await ctx.params).roomId);
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Ongeldige aanvraag.' }, 400);
  }
  if (tooManyFails(roomId)) return json({ error: 'Te veel pogingen. Probeer het over 10 minuten opnieuw.' }, 429);

  const db = await getDb();
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId));
  if (!room) return json({ error: 'Deze kamer bestaat niet.' }, 404);
  if (!verifyPin(roomId, String(body?.pin ?? '').trim(), room.hostPin)) {
    registerFail(roomId);
    return json({ error: 'Onjuiste pincode.' }, 401);
  }
  clearFails(roomId);

  const subs = await db.select().from(submissions).where(eq(submissions.roomId, roomId));
  return json({
    room: { id: room.id, players: JSON.parse(room.players) as string[] },
    submissions: subs.map((s) => ({
      id: s.id,
      authorName: s.authorName,
      targetPlayerName: s.targetPlayerName,
      type: s.type,
      content: s.content,
      createdAt: s.createdAt,
    })),
  });
}
