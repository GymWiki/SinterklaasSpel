import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

let client: Client | null = null;
let ready: Promise<void> | null = null;

function getClient() {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:local.db',
      authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    });
  }
  return client;
}

/** Idempotent: maakt de tabellen aan als ze nog niet bestaan (handig voor een lege Turso-database). */
async function ensureSchema(c: Client) {
  await c.batch(
    [
      `CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY NOT NULL,
        host_pin TEXT NOT NULL,
        players TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY NOT NULL,
        room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        author_name TEXT NOT NULL,
        target_player_name TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE INDEX IF NOT EXISTS submissions_room_idx ON submissions (room_id)`,
    ],
    'write',
  );
}

export async function getDb() {
  const c = getClient();
  if (!ready) {
    ready = ensureSchema(c).catch((e) => {
      ready = null;
      throw e;
    });
  }
  await ready;
  return drizzle(c, { schema });
}
