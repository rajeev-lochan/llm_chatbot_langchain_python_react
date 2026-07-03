import React, { useEffect, useRef, useState } from "react";
import { streamAnswer } from "../hooks/langchain";
import { useSpeech } from "../hooks/useSpeech";
import "./ResponseAnswer.css";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  addMessage,
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

  const {
    isListening,
    voiceEnabled,
    startListening,
    stopListening,
    speak,
    toggleVoice,
  } = useSpeech();

  useEffect(() => {
    if (sessionId) {
      dispatch(loadChatHistory(sessionId));
    }
  }, [dispatch, sessionId]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // const handleMicClick = () => {
  //   if (isListening) {
  //     stopListening();
  //   } else {
  //     startListening((text) => {
  //       setQuestion(text);
  //     });
  //   }
  // };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(async (text) => {
        setQuestion(text); // optional, user briefly sees what was recognized
        await sendMessage(text);
      });
    }
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
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
      },
    );

    if (!streamError) {
      await dispatch(
        saveChatTurn({
          sessionId,
          messages: [
            userMessage,
            { role: "assistant", content: assistantText },
          ],
        }),
      );

      speak(assistantText);
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await sendMessage(question);
  };

  return (
    <div className="chat-container">
      <div className="header">
        <div className="header-top">
          <img src={logo} alt="Vadistra Logo" />
          <h1>Vadistra</h1>
          <button
            type="button"
            className={`voice-toggle-btn ${voiceEnabled ? "voice-on" : "voice-off"}`}
            onClick={toggleVoice}
            title={
              voiceEnabled ? "Mute voice assistant" : "Unmute voice assistant"
            }
          >
            {voiceEnabled ? "🔊" : "🔇"}
          </button>
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
        <button
          type="button"
          className={`mic-btn ${isListening ? "active" : ""}`}
          onClick={handleMicClick}
          disabled={loading}
          title={isListening ? "Stop listening" : "Dictate question"}
        >
          {isListening ? "🛑" : "🎤"}
        </button>
        <input
          type="text"
          value={question}
          placeholder={
            isListening ? "Listening... Speak now!" : "Ask something..."
          }
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || isListening}>
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
