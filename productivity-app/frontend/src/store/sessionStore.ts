import { create } from "zustand";

interface LiveSignals {
  posture: "good" | "bad" | null;
  eyes: "open" | "closed" | "away" | null;
  activity: "focused" | "distracted" | "idle" | null;
  drinking: string | null;
}

interface SessionState {
  sessionId: number | null;
  goalText: string;
  durationMinutes: number;
  isActive: boolean;
  signals: LiveSignals;
  setSession: (id: number, goal: string, duration: number) => void;
  clearSession: () => void;
  updateSignal: (key: keyof LiveSignals, value: string) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: null,
  goalText: "",
  durationMinutes: 25,
  isActive: false,
  signals: { posture: null, eyes: null, activity: null, drinking: null },

  setSession: (id, goal, duration) =>
    set({ sessionId: id, goalText: goal, durationMinutes: duration, isActive: true }),

  clearSession: () =>
    set({ sessionId: null, isActive: false, signals: { posture: null, eyes: null, activity: null, drinking: null } }),

  updateSignal: (key, value) =>
    set((s) => ({ signals: { ...s.signals, [key]: value } })),
}));
