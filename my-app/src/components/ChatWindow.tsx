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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSelectedImage(event.target.result as string);
      }
    };
    reader.onerror = (err) => {
      console.error("FileReader error:", err);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(async (text) => {
        setQuestion(text);
        await sendMessage(text, selectedImage || undefined);
      });
    }
  };

  const sendMessage = async (text: string, imageToSubmit?: string) => {
    const trimmed = text.trim();
    if ((!trimmed && !imageToSubmit) || loading) return;

    const userMessage = {
      role: "user" as const,
      content: trimmed,
      image: imageToSubmit,
    };

    setQuestion("");
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setError("");
    setLoading(true);

    dispatch(addMessage(userMessage));
    dispatch(addMessage({ role: "assistant", content: "" }));

    let assistantText = "";
    let streamError = "";

    await streamAnswer(
      trimmed,
      imageToSubmit,
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
    await sendMessage(question, selectedImage || undefined);
  };

  const renderMessageContent = (content: string) => {
    const markdownImageRegex = /!\[(.*?)\]\((.*?)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = markdownImageRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      const alt = match[1];
      const url = match[2];

      parts.push(
        <div className="generated-image-container" key={match.index}>
          <img
            src={url}
            alt={alt}
            className="generated-image"
            onLoad={() => {
              chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        </div>
      );

      lastIndex = markdownImageRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
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
              {msg.image && (
                <div className="chat-msg-image-wrapper">
                  <img
                    src={msg.image}
                    alt="Uploaded attachment"
                    className="chat-msg-image"
                  />
                </div>
              )}
              {msg.content && <span className="chat-msg-text">{renderMessageContent(msg.content)}</span>}
            </div>
          );
        })}

        {loading && <div className="loader">Thinking...</div>}
        <div ref={chatEndRef} />
      </div>

      {selectedImage && (
        <div className="image-preview-container">
          <img
            src={selectedImage}
            alt="Selected preview"
            className="image-preview"
          />
          <button
            type="button"
            onClick={clearSelectedImage}
            className="clear-image-btn"
            title="Remove image"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="input-box">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          style={{ display: "none" }}
        />
        <button
          type="button"
          onClick={triggerFileInput}
          className="attach-btn"
          disabled={loading}
          title="Upload image"
        >
          📷
        </button>
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
