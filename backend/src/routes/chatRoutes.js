import { Router } from "express";

import {
  healthCheck,
  fetchChatHistory,
  createChatHistory,
  removeChatHistory,
} from "../controllers/chatController.js";

const router = Router();

router.get("/health", healthCheck);

router.get("/chat-history", fetchChatHistory);

router.post("/chat-history", createChatHistory);

router.delete("/chat-history", removeChatHistory);

export default router;