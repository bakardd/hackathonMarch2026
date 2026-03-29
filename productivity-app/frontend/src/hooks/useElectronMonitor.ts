import { useEffect, useRef } from "react";
import { logEvent } from "../api/client";
import { appMatchesSelection, canonicalizeAppName } from "../lib/appMonitor";
import { useSessionStore } from "../store/sessionStore";

const DISTRACTION_DELAY_MS = 4000; // grace period before alerting
const ALWAYS_ALLOWED = ["Electron"];

export function useElectronMonitor() {
  const { sessionId, allowedApps, updateSignal, setDistractionApp, setPermissionError } =
    useSessionStore();
  const activeWarningApp = useRef<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const api = (window as any).electronAPI;
    if (!api) return; // no-op in browser mode

    let distractionTimer: ReturnType<typeof setTimeout> | null = null;
    let warnedApp: string | null = null;

    const clearTimer = () => {
      if (distractionTimer) { clearTimeout(distractionTimer); distractionTimer = null; }
    };

    const isAllowed = (name: string) =>
      ALWAYS_ALLOWED.some((a) => appMatchesSelection(name, a)) ||
      allowedApps.some((a: string) => appMatchesSelection(name, a));

    api.onActivity((data: { app: string; title: string }) => {
      setPermissionError(null);
      const name = canonicalizeAppName(data.app);

      // Ignore focus events from our own overlay window
      if (name === "Electron" && activeWarningApp.current) return;

      if (isAllowed(name)) {
        clearTimer();
        warnedApp = null;
        activeWarningApp.current = null;
        setDistractionApp(null);
        updateSignal("activity", "focused");
        api.hideDistractionOverlay?.();
        logEvent({ session_id: sessionId, type: "activity", value: "focused", app_name: name });
        return;
      }

      // Already warned about this app — don't re-fire
      if (warnedApp === name || distractionTimer) return;

      clearTimer();
      distractionTimer = setTimeout(() => {
        warnedApp = name;
        activeWarningApp.current = name;
        setDistractionApp(name);
        updateSignal("activity", "distracted");
        api.notifyDistraction?.(name);
        api.showDistractionOverlay?.({ currentApp: name, allowedApps });
        logEvent({ session_id: sessionId, type: "activity", value: "distracted", app_name: name });
        distractionTimer = null;
      }, DISTRACTION_DELAY_MS);
    });

    api.onActivityError?.((data: { message: string }) => {
      clearTimer();
      activeWarningApp.current = null;
      api.hideDistractionOverlay?.();
      setPermissionError(data.message);
    });

    api.onIdle((data: { idle: boolean }) => {
      if (data.idle) {
        clearTimer();
        activeWarningApp.current = null;
        api.hideDistractionOverlay?.();
        updateSignal("activity", "idle");
        logEvent({ session_id: sessionId, type: "idle", value: "true" });
      }
    });

    return () => clearTimer();
  }, [allowedApps, sessionId, setDistractionApp, setPermissionError, updateSignal]);
}
