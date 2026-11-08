import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { rooms, submissions } from '@/db/schema';
import { json, newId, normalizeRoomId } from '@/lib/server/rooms';
import { GENERAL_TARGET, MAX_CONTENT, contentOk } from '@/lib/constants';

export const dynamic = 'force-dynamic';

/** Een geheim of gedichtje insturen (Fase 1, publiek). */
export async function POST(req: Request, ctx: { params: Promise<{ roomId: string }> }) {
  const roomId = normalizeRoomId((await ctx.params).roomId);
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Ongeldige aanvraag.' }, 400);
  }
  const db = await getDb();
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId));
  if (!room) return json({ error: 'Deze kamer bestaat niet.' }, 404);

  const players: string[] = JSON.parse(room.players);
  const authorName = String(body?.authorName ?? '').trim().replace(/\s+/g, ' ').slice(0, 24);
  const targetPlayerName = String(body?.targetPlayerName ?? '').trim();
  const type = body?.type === 'poem' ? 'poem' : body?.type === 'secret' ? 'secret' : null;
  const content = String(body?.content ?? '').trim();

  if (!authorName) return json({ error: 'Vul in wie je bent.' }, 400);
  if (!type) return json({ error: 'Kies geheim of gedichtje.' }, 400);
  if (targetPlayerName !== GENERAL_TARGET && !players.includes(targetPlayerName))
    return json({ error: 'Kies over wie het gaat.' }, 400);
  if (!contentOk(content)) return json({ error: 'Schrijf minimaal 3 woorden / 15 tekens.' }, 400);
  if (content.length > MAX_CONTENT) return json({ error: `Maximaal ${MAX_CONTENT} tekens.` }, 400);

  const [{ n }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(submissions)
    .where(and(eq(submissions.roomId, roomId), eq(submissions.authorName, authorName)));
  if (n >= 12) return json({ error: 'Je hebt al 12 inzendingen gedaan, dat is genoeg! 🎁' }, 429);
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(submissions)
    .where(eq(submissions.roomId, roomId));
  if (total >= 300) return json({ error: 'Het Grote Boek zit vol!' }, 429);

  const id = newId();
  await db.insert(submissions).values({ id, roomId, authorName, targetPlayerName, type, content });
  return json({ id }, 201);
}
