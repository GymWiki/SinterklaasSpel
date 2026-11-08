import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { rooms } from '@/db/schema';
import { json, normalizeRoomId } from '@/lib/server/rooms';

export const dynamic = 'force-dynamic';

/** Publiek (voor /join): alleen de spelersnamen, nooit de pin of inzendingen. */
export async function GET(_req: Request, ctx: { params: Promise<{ roomId: string }> }) {
  const roomId = normalizeRoomId((await ctx.params).roomId);
  const db = await getDb();
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId));
  if (!room) return json({ error: 'Deze kamer bestaat niet.' }, 404);
  return json({ id: room.id, players: JSON.parse(room.players) as string[] });
}
