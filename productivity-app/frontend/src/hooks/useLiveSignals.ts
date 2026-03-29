import { useEffect } from "react";
import { createWebSocket } from "../api/client";
import { useSessionStore } from "../store/sessionStore";

export function useLiveSignals() {
  const { sessionId, updateSignal } = useSessionStore();

  useEffect(() => {
    if (!sessionId) return;
    const ws = createWebSocket(sessionId);

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "posture") updateSignal("posture", data.value);
      if (data.type === "eyes") updateSignal("eyes", data.value);
      if (data.type === "activity") updateSignal("activity", data.value);
    };

    return () => ws.close();
  }, [sessionId]);
}
