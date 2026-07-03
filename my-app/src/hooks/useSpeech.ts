import { useState, useEffect, useRef } from "react";

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startListening = (onResult: (text: string) => void) => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    // Cancel any ongoing speaking
    window.speechSynthesis.cancel();

    recognitionRef.current.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onResult(text);
    };

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error("Start speech recognition failed:", err);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Stop speech recognition failed:", err);
      }
    }
  };

  const speak = (text: string) => {
    if (!voiceEnabled) return;

    // Stop any current synthesis before speaking
    window.speechSynthesis.cancel();

    if (!text) return;

    // Clean markdown bold symbols and extra spacing for better pronunciation
    const cleanText = text
      .replace(/\*\*|__/g, "")
      .replace(/#+\s/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const toggleVoice = () => {
    setVoiceEnabled((prev) => {
      const newVal = !prev;
      if (!newVal) {
        window.speechSynthesis.cancel();
      }
      return newVal;
    });
  };

  return {
    isListening,
    voiceEnabled,
    startListening,
    stopListening,
    speak,
    toggleVoice,
  };
}
