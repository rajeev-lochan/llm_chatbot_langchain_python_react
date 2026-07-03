import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { getOrCreateSessionId } from "../../utils/sessionId";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatState = {
  sessionId: string;
  messages: ChatMessage[];
  status: "idle" | "loading" | "saving" | "error";
  error: string | null;
};

const initialState: ChatState = {
  sessionId: getOrCreateSessionId(),
  messages: [],
  status: "idle",
  error: null,
};

const chatHistoryUrl = "/api/chat-history";

export const loadChatHistory = createAsyncThunk<
  ChatMessage[],
  string,
  { rejectValue: string }
>("chat/loadHistory", async (sessionId, { rejectWithValue }) => {
  const response = await fetch(
    `${chatHistoryUrl}?sessionId=${encodeURIComponent(sessionId)}`
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return rejectWithValue(data?.error ?? "Unable to load chat history.");
  }

  return Array.isArray(data?.messages)
    ? data.messages.map((message: ChatMessage) => ({
        role: message.role,
        content: message.content,
      }))
    : [];
});

type SaveChatTurnPayload = {
  sessionId: string;
  messages: ChatMessage[];
};

export const saveChatTurn = createAsyncThunk<
  { saved: number },
  SaveChatTurnPayload,
  { rejectValue: string }
>("chat/saveTurn", async (payload, { rejectWithValue }) => {
  const response = await fetch(chatHistoryUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return rejectWithValue(data?.error ?? "Unable to save chat history.");
  }

  return {
    saved:
      typeof data?.saved === "number" ? data.saved : payload.messages.length,
  };
});

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    updateLastMessage: (state, action: PayloadAction<string>) => {
      const last = state.messages[state.messages.length - 1];
      if (last && last.role === "assistant") {
        last.content = action.payload;
      }
    },
    setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.messages = action.payload;
    },
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload;
      sessionStorage.setItem("chat_session_id", action.payload);
    },
    clearChat: (state) => {
      state.messages = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadChatHistory.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loadChatHistory.fulfilled, (state, action) => {
        state.status = "idle";
        state.messages = action.payload;
      })
      .addCase(loadChatHistory.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload ?? "Unable to load chat history.";
      })
      .addCase(saveChatTurn.pending, (state) => {
        state.status = "saving";
        state.error = null;
      })
      .addCase(saveChatTurn.fulfilled, (state) => {
        state.status = "idle";
      })
      .addCase(saveChatTurn.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload ?? "Unable to save chat history.";
      });
  },
});

export const {
  addMessage,
  updateLastMessage,
  setMessages,
  setSessionId,
  clearChat,
} = chatSlice.actions;

export default chatSlice.reducer;
