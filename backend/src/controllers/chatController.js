import { hasDatabase } from "../config/db.js";
import {
  getChatHistory,
  saveMessages,
  deleteChatHistory,
} from "../services/chatService.js";

export async function healthCheck(req, res) {
  res.json({
    ok: true,
    database: hasDatabase ? "connected" : "missing DATABASE_URL",
  });
}

export async function fetchChatHistory(req, res) {
  console.log(hasDatabase, "hasDatabase");
  if (!hasDatabase) {
    return res.status(503).json({
      error: "DATABASE_URL is not configured.",
    });
  }

  const sessionId = String(req.query.sessionId ?? "").trim();

  if (!sessionId) {
    return res.status(400).json({
      error: "sessionId is required.",
    });
  }

  const rows = await getChatHistory(sessionId);

  res.json({
    sessionId,
    messages: rows.map((row) => ({
      role: row.role,
      content: row.content,
      createdAt: row.created_at,
    })),
  });
}

export async function createChatHistory(req, res) {
  if (!hasDatabase) {
    return res.status(503).json({
      error: "DATABASE_URL is not configured.",
    });
  }

  const { sessionId, messages } = req.body;

  if (!sessionId?.trim()) {
    return res.status(400).json({
      error: "sessionId is required.",
    });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: "messages must be a non-empty array.",
    });
  }

  const saved = await saveMessages(sessionId.trim(), messages);

  res.status(201).json({ saved });
}

export async function removeChatHistory(req, res) {
  if (!hasDatabase) {
    return res.status(503).json({
      error: "DATABASE_URL is not configured.",
    });
  }

  const sessionId = String(req.query.sessionId ?? "").trim();

  if (!sessionId) {
    return res.status(400).json({
      error: "sessionId is required.",
    });
  }

  const deletedRows = await deleteChatHistory(sessionId);

  res.json({
    sessionId,
    deleted: deletedRows.length,
  });
}