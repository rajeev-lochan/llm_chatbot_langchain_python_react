import { sql } from "../config/db.js";

export async function ensureSchema() {
  if (!sql) return;

  await sql`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id BIGSERIAL PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS chat_messages_session_created_at_idx
    ON chat_messages (session_id, created_at, id)
  `;
}