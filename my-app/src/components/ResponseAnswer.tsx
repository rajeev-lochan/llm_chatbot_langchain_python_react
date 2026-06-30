import React, { useEffect, useRef, useState } from "react";
import { streamAnswer } from "../hooks/langchain";
import "./responseAnswer.css";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const ResponseAnswer: React.FC = () => {
  const [question, setQuestion] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmed = question.trim();
    if (!trimmed) return; // ❌ prevent empty API call

    const userMessage: Message = { role: "user", content: trimmed };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    // placeholder assistant message
    let assistantText = "";

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    await streamAnswer(
      trimmed,
      (chunk) => {
        assistantText += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: assistantText,
          };
          return updated;
        });
      },
      (errorMessage) => {
        setError(errorMessage);
      }
    );

    setLoading(false);
  };

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-container">
      <h1>My GPT</h1>

      <div className="chat-box">
        {messages.map((msg, i) => {
          const isLastAssistant =
            msg.role === "assistant" && i === messages.length - 1;

          if (error && isLastAssistant) {
            return null; // ❌ hide only last response when error occurs
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
        />
        <button type="submit">➤</button>
      </form>
      
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default ResponseAnswer;
