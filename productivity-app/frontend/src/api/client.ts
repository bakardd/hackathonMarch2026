const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function startSession(goalText: string, durationMinutes: number) {
  const res = await fetch(`${BASE}/sessions/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal_text: goalText, duration_minutes: durationMinutes }),
  });
  return res.json() as Promise<{ session_id: number; goal_id: number }>;
}

export async function endSession(sessionId: number) {
  await fetch(`${BASE}/sessions/${sessionId}/end`, { method: "POST" });
}

export async function getSessionSummary(sessionId: number) {
  const res = await fetch(`${BASE}/analytics/${sessionId}/summary`);
  return res.json();
}

export async function logEvent(payload: {
  session_id: number;
  type: string;
  value: string;
  confidence?: number;
  app_name?: string;
}) {
  await fetch(`${BASE}/events/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function createWebSocket(sessionId: number): WebSocket {
  const wsBase = BASE.replace("http", "ws");
  return new WebSocket(`${wsBase}/ws/${sessionId}`);
}
