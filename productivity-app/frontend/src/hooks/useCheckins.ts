import { useEffect, useState } from "react";
import { logEvent } from "../api/client";
import { useSessionStore } from "../store/sessionStore";

const CHECKIN_INTERVAL_MS = 10 * 60 * 1000; // every 10 min

export const CHECKIN_QUESTIONS = [
  { id: "posture", label: "Are you sitting upright?" },
  { id: "water", label: "Have you had water recently?" },
  { id: "focus", label: "Are you still focused on your goal?" },
];

export function useCheckins() {
  const { sessionId } = useSessionStore();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(() => setShowModal(true), CHECKIN_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [sessionId]);

  const submitCheckin = (answers: Record<string, boolean>) => {
    if (!sessionId) return;
    Object.entries(answers).forEach(([key, val]) => {
      logEvent({ session_id: sessionId, type: "checkin", value: val ? "yes" : "no", app_name: key });
    });
    setShowModal(false);
  };

  return { showModal, submitCheckin };
}
