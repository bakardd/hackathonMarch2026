import { useEffect } from "react";
import { logEvent } from "../api/client";
import { useSessionStore } from "../store/sessionStore";

const DISTRACTING_APPS = ["YouTube", "Twitter", "Reddit", "TikTok", "Instagram", "Netflix"];

function classifyApp(appName: string, title: string): "focused" | "distracted" {
  if (DISTRACTING_APPS.some((d) => title.includes(d) || appName.includes(d))) {
    return "distracted";
  }
  return "focused";
}

export function useElectronMonitor() {
  const { sessionId, updateSignal } = useSessionStore();

  useEffect(() => {
    if (!sessionId) return;

    // Only runs inside Electron
    const api = (window as any).electronAPI;
    if (!api) return;

    api.onActivity((data: { app: string; title: string }) => {
      const state = classifyApp(data.app, data.title);
      updateSignal("activity", state);
      logEvent({
        session_id: sessionId,
        type: "activity",
        value: state,
        app_name: data.app,
      });
    });

    api.onIdle((data: { idle: boolean }) => {
      if (data.idle) {
        updateSignal("activity", "idle");
        logEvent({ session_id: sessionId, type: "idle", value: "true" });
      }
    });
  }, [sessionId]);
}
