import { useEffect, useRef } from "react";
import { logEvent } from "../api/client";
import { useSessionStore } from "../store/sessionStore";

const IDLE_THRESHOLD_MS = 60_000; // 1 min
const CHECK_INTERVAL_MS = 5_000;

export function useActivityMonitor() {
  const { sessionId, updateSignal } = useSessionStore();
  const lastActivity = useRef(Date.now());

  useEffect(() => {
    if (!sessionId) return;

    const resetTimer = () => { lastActivity.current = Date.now(); };
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);

    // Idle detection
    const idleInterval = setInterval(() => {
      const idle = Date.now() - lastActivity.current > IDLE_THRESHOLD_MS;
      const state = idle ? "idle" : "focused";
      updateSignal("activity", state);
      logEvent({ session_id: sessionId, type: "idle", value: String(idle) });
    }, CHECK_INTERVAL_MS);

    // Tab visibility
    const handleVisibility = () => {
      const state = document.hidden ? "distracted" : "focused";
      updateSignal("activity", state);
      logEvent({ session_id: sessionId, type: "activity", value: state });
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(idleInterval);
    };
  }, [sessionId]);
}
