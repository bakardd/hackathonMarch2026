import { useEffect, useRef } from "react";
import { logEvent } from "../api/client";
import { appMatchesSelection, canonicalizeAppName } from "../lib/appMonitor";
import { useSessionStore } from "../store/sessionStore";

const DISTRACTING_APPS = ["YouTube", "Twitter", "Reddit", "TikTok", "Instagram", "Netflix"];
const DISTRACTION_DELAY_MS = 4000;
const ALWAYS_ALLOWED_APPS = ["Electron"];

function classifyApp(appName: string, title: string): "focused" | "distracted" {
  if (DISTRACTING_APPS.some((d) => title.includes(d) || appName.includes(d))) {
    return "distracted";
  }
  return "focused";
}

export function useElectronMonitor() {
  const {
    sessionId,
    allowedApps,
    updateSignal,
    showDistractionWarning,
    hideDistractionWarning,
    setPermissionError,
  } = useSessionStore();
  const activeWarningAppRef = useRef<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    // Only runs inside Electron
    const api = (window as any).electronAPI;
    if (!api) return;
    let distractionTimer: ReturnType<typeof setTimeout> | null = null;
    let warnedApp: string | null = null;

    const clearDistractionTimer = () => {
      if (!distractionTimer) return;
      clearTimeout(distractionTimer);
      distractionTimer = null;
    };

    const isAllowedApp = (appName: string) =>
      ALWAYS_ALLOWED_APPS.some((allowedApp) => appMatchesSelection(appName, allowedApp))
      || allowedApps.some((allowedApp) => appMatchesSelection(appName, allowedApp));

    api.onActivity((data: { app: string; title: string }) => {
      setPermissionError(null);
      const detectedAppName = canonicalizeAppName(data.app);
      const state = classifyApp(detectedAppName, data.title);
      const appIsAllowed = allowedApps.length === 0 || isAllowedApp(detectedAppName);
      const nextState = appIsAllowed ? state : "distracted";

      // The warning overlay itself can temporarily make Electron the active app.
      // Do not auto-clear the warning just because focus moved to our own overlay window.
      if (detectedAppName === "Electron" && activeWarningAppRef.current) {
        return;
      }

      updateSignal("activity", nextState);

      if (appIsAllowed) {
        clearDistractionTimer();
        warnedApp = null;
        activeWarningAppRef.current = null;
        hideDistractionWarning();
        api.hideDistractionOverlay?.();
        logEvent({
          session_id: sessionId,
          type: "activity",
          value: nextState,
          app_name: detectedAppName,
        });
        return;
      }

      if (warnedApp === detectedAppName || distractionTimer) return;

      clearDistractionTimer();
      distractionTimer = setTimeout(() => {
        warnedApp = detectedAppName;
        activeWarningAppRef.current = detectedAppName;
        showDistractionWarning(detectedAppName);
        api.notifyDistraction?.(detectedAppName);
        api.showDistractionOverlay?.({ currentApp: detectedAppName, allowedApps });
        logEvent({
          session_id: sessionId,
          type: "activity",
          value: "distracted",
          app_name: detectedAppName,
        });
        distractionTimer = null;
      }, DISTRACTION_DELAY_MS);
    });

    api.onActivityError?.((data: { message: string }) => {
      clearDistractionTimer();
      activeWarningAppRef.current = null;
      api.hideDistractionOverlay?.();
      setPermissionError(data.message);
    });

    api.onIdle((data: { idle: boolean }) => {
      if (data.idle) {
        clearDistractionTimer();
        activeWarningAppRef.current = null;
        api.hideDistractionOverlay?.();
        updateSignal("activity", "idle");
        logEvent({ session_id: sessionId, type: "idle", value: "true" });
      }
    });

    return () => {
      clearDistractionTimer();
      activeWarningAppRef.current = null;
    };
  }, [allowedApps, hideDistractionWarning, sessionId, setPermissionError, showDistractionWarning, updateSignal]);
}
