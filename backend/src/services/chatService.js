import { sql } from "../config/db.js";

export async function getChatHistory(sessionId) {
  return await sql`
    SELECT role, content, image, created_at
    FROM chat_messages
    WHERE session_id = ${sessionId}
    ORDER BY created_at ASC, id ASC
  `;
}

export async function saveMessages(sessionId, messages) {
  let saved = 0;

  for (const message of messages) {
    await sql`
      INSERT INTO chat_messages (session_id, role, content, image)
      VALUES (${sessionId}, ${message.role}, ${message.content}, ${message.image || null})
    `;

    saved++;
  }

  return saved;
}

export async function deleteChatHistory(sessionId) {
  return await sql`
    DELETE FROM chat_messages
    WHERE session_id = ${sessionId}
    RETURNING id
  `;
}