import React, { useEffect, useRef, useState } from "react";
import { streamAnswer } from "../hooks/langchain";
import "./responseAnswer.css";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  addMessage,
  initSession,
  loadChatHistory,
  saveChatTurn,
  updateLastMessage,
} from "../redux/features/chatSlice";
import logo from "../assets/logo.png";

const ChatWindow: React.FC = () => {
  const dispatch = useAppDispatch();
  const sessionId = useAppSelector((state) => state.chat.sessionId);
  console.log("sessionId in ChatWindow:", sessionId);
  const messages = useAppSelector((state) => state.chat.messages);
  const historyError = useAppSelector((state) => state.chat.error);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    dispatch(initSession());
  }, [dispatch]);

  useEffect(() => {
    if (sessionId) {
      dispatch(loadChatHistory(sessionId));
    }
  }, [dispatch, sessionId]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmed = question.trim();
    if (!trimmed || loading) return;

    const userMessage = { role: "user" as const, content: trimmed };
    setQuestion("");
    setError("");
    setLoading(true);

    dispatch(addMessage(userMessage));
    dispatch(addMessage({ role: "assistant", content: "" }));

    let assistantText = "";
    let streamError = "";

    await streamAnswer(
      trimmed,
      (chunk) => {
        assistantText += chunk;
        dispatch(updateLastMessage(assistantText));
      },
      (errorMessage) => {
        streamError = errorMessage;
        setError(errorMessage);
      }
    );

    if (!streamError) {
      await dispatch(
        saveChatTurn({
          sessionId,
          messages: [
            userMessage,
            { role: "assistant", content: assistantText },
          ],
        })
      );
    }

    setLoading(false);
  };

  return (
    <div className="chat-container">
      <div className="header">
        <div className="header-top">
          <img src={logo} alt="Vadistra Logo" />
          <h1>Vadistra</h1>
        </div>

        <p className="subtitle">Suggests wisdom and intelligence</p>
      </div>

      <div className="chat-box">
        {messages.map((msg, i) => {
          const isLastAssistant =
            msg.role === "assistant" && i === messages.length - 1;

          if (error && isLastAssistant) {
            return null;
          }

          return (
            <div key={i} className={`msg ${msg.role}`}>
              {msg.content}
            </div>
          );
        })}

        {loading && <div className="loader">Thinking...</div>}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="input-box">
        <input
          type="text"
          value={question}
          placeholder="Ask something..."
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          ➤
        </button>
      </form>

      {(error || historyError) && (
        <div className="error">{error || historyError}</div>
      )}
    </div>
  );
};

export default ChatWindow;
