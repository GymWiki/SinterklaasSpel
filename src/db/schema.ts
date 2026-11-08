import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/** Een spel-kamer. `hostPin` bevat een gesalte hash van de pincode (nooit de pin zelf). */
export const rooms = sqliteTable('rooms', {
  id: text('id').primaryKey(), // 6-karakter code
  hostPin: text('host_pin').notNull(),
  players: text('players').notNull(), // JSON array met spelersnamen
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/** Inzendingen voor "Het Grote Boek van Sinterklaas". */
export const submissions = sqliteTable(
  'submissions',
  {
    id: text('id').primaryKey(),
    roomId: text('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    authorName: text('author_name').notNull(),
    targetPlayerName: text('target_player_name').notNull(),
    type: text('type', { enum: ['secret', 'poem'] }).notNull(),
    content: text('content').notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index('submissions_room_idx').on(t.roomId)],
);

export type Room = typeof rooms.$inferSelect;
export type SubmissionRow = typeof submissions.$inferSelect;
