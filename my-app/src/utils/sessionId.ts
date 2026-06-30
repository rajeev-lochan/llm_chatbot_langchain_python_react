const SESSION_KEY = "chat_session_id";

export const getSessionId = () => {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_KEY);
};

export const setSessionId = (id: string) => {
  sessionStorage.setItem(SESSION_KEY, id);
};

export const createSessionId = () => {
  return `session-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
};

export const getOrCreateSessionId = () => {
  const existing = getSessionId();
  if (existing) return existing;

  const newId = createSessionId();
  setSessionId(newId);
  return newId;
};