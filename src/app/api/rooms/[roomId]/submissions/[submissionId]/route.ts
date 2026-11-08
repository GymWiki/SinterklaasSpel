import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { rooms, submissions } from '@/db/schema';
import { json, normalizeRoomId, registerFail, tooManyFails, verifyPin } from '@/lib/server/rooms';

export const dynamic = 'force-dynamic';

/** Host verwijdert een (dubbele) inzending in de lobby. Pin via header `x-host-pin`. */
export async function DELETE(req: Request, ctx: { params: Promise<{ roomId: string; submissionId: string }> }) {
  const p = await ctx.params;
  const roomId = normalizeRoomId(p.roomId);
  if (tooManyFails(roomId)) return json({ error: 'Te veel pogingen.' }, 429);
  const db = await getDb();
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId));
  if (!room) return json({ error: 'Deze kamer bestaat niet.' }, 404);
  if (!verifyPin(roomId, (req.headers.get('x-host-pin') ?? '').trim(), room.hostPin)) {
    registerFail(roomId);
    return json({ error: 'Onjuiste pincode.' }, 401);
  }
  await db.delete(submissions).where(and(eq(submissions.roomId, roomId), eq(submissions.id, p.submissionId)));
  return json({ ok: true });
}
