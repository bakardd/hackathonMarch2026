import { create } from "zustand";

interface LiveSignals {
  posture: "good" | "bad" | null;
  eyes: "open" | "closed" | "away" | null;
  activity: "focused" | "distracted" | "idle" | null;
  drinking: string | null;
}

interface DistractionWarning {
  visible: boolean;
  currentApp: string | null;
}

interface MonitorStatus {
  permissionError: string | null;
}

interface SessionState {
  sessionId: number | null;
  goalText: string;
  durationMinutes: number;
  isActive: boolean;
  signals: LiveSignals;
  allowedApps: string[];
  distractionWarning: DistractionWarning;
  monitorStatus: MonitorStatus;
  setSession: (id: number, goal: string, duration: number, allowedApps: string[]) => void;
  clearSession: () => void;
  updateSignal: (key: keyof LiveSignals, value: string) => void;
  showDistractionWarning: (currentApp: string) => void;
  hideDistractionWarning: () => void;
  setPermissionError: (message: string | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: null,
  goalText: "",
  durationMinutes: 25,
  isActive: false,
  allowedApps: [],
  distractionWarning: { visible: false, currentApp: null },
  monitorStatus: { permissionError: null },
  signals: { posture: null, eyes: null, activity: null, drinking: null },

  setSession: (id, goal, duration, allowedApps) =>
    set({
      sessionId: id,
      goalText: goal,
      durationMinutes: duration,
      isActive: true,
      allowedApps,
      distractionWarning: { visible: false, currentApp: null },
      monitorStatus: { permissionError: null },
    }),

  clearSession: () =>
    set({
      sessionId: null,
      isActive: false,
      allowedApps: [],
      distractionWarning: { visible: false, currentApp: null },
      monitorStatus: { permissionError: null },
      signals: { posture: null, eyes: null, activity: null, drinking: null },
    }),

  updateSignal: (key, value) =>
    set((s) => ({ signals: { ...s.signals, [key]: value } })),

  showDistractionWarning: (currentApp) =>
    set({ distractionWarning: { visible: true, currentApp } }),

  hideDistractionWarning: () =>
    set({ distractionWarning: { visible: false, currentApp: null } }),

  setPermissionError: (message) =>
    set({ monitorStatus: { permissionError: message } }),
}));
