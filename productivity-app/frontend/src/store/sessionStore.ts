import { create } from "zustand";

interface LiveSignals {
  posture: "good" | "bad" | null;
  eyes: "open" | "closed" | null;
  activity: "focused" | "distracted" | "idle" | null;
}

interface SessionState {
  sessionId: number | null;
  goalText: string;
  durationMinutes: number;
  isActive: boolean;
  signals: LiveSignals;
  allowedApps: string[];
  distractionApp: string | null; // currently distracting app name, null if focused
  permissionError: string | null;

  setSession: (id: number, goal: string, duration: number, allowedApps: string[]) => void;
  clearSession: () => void;
  updateSignal: (key: keyof LiveSignals, value: string) => void;
  setDistractionApp: (app: string | null) => void;
  setPermissionError: (msg: string | null) => void;
}

const EMPTY_SIGNALS: LiveSignals = { posture: null, eyes: null, activity: null };

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: null,
  goalText: "",
  durationMinutes: 25,
  isActive: false,
  signals: EMPTY_SIGNALS,
  allowedApps: [],
  distractionApp: null,
  permissionError: null,

  setSession: (id, goal, duration, allowedApps) =>
    set({ sessionId: id, goalText: goal, durationMinutes: duration, isActive: true, allowedApps, distractionApp: null, permissionError: null }),

  clearSession: () =>
    set({ sessionId: null, isActive: false, allowedApps: [], distractionApp: null, permissionError: null, signals: EMPTY_SIGNALS }),

  updateSignal: (key, value) =>
    set((s) => ({ signals: { ...s.signals, [key]: value } })),

  setDistractionApp: (app) => set({ distractionApp: app }),
  setPermissionError: (msg) => set({ permissionError: msg }),
}));
