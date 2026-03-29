#!/usr/bin/env python3
"""
macOS menu bar app for productivity monitor.
Usage: python app.py --session <id>
"""
import argparse
import json
import threading
import time

import rumps
import websocket

API_BASE = "http://localhost:8000"
WS_BASE  = "ws://localhost:8000"

EYE_ICONS = {
    "open":   "👁️  On screen",
    "closed": "😴 Eyes closed",
    "away":   "👀 Looking away",
    None:     "👁️  —",
}

POSTURE_ICONS = {
    "good": "🪑 Good posture",
    "bad":  "⚠️  Bad posture",
    None:   "🪑 —",
}


class MonitorApp(rumps.App):
    def __init__(self, session_id: int):
        super().__init__("👁️", quit_button="Quit")
        self.session_id = session_id

        self._eyes    = None
        self._posture = None
        self._log: list[str] = []

        # Menu items
        self.session_item  = rumps.MenuItem(f"Session #{session_id}")
        self.eyes_item     = rumps.MenuItem(EYE_ICONS[None])
        self.posture_item  = rumps.MenuItem(POSTURE_ICONS[None])
        self.divider       = rumps.separator
        self.log_title     = rumps.MenuItem("— recent —")

        self.log_items = [rumps.MenuItem("") for _ in range(8)]
        for item in self.log_items:
            item.set_callback(None)

        self.menu = [
            self.session_item,
            rumps.separator,
            self.eyes_item,
            self.posture_item,
            rumps.separator,
            self.log_title,
            *self.log_items,
        ]

        # Start WebSocket listener in background
        threading.Thread(target=self._connect_ws, daemon=True).start()

    # ------------------------------------------------------------------
    def _connect_ws(self):
        url = f"{WS_BASE}/ws/{self.session_id}"
        while True:
            try:
                ws = websocket.WebSocketApp(
                    url,
                    on_message=self._on_message,
                    on_error=lambda ws, e: None,
                    on_close=lambda ws, c, m: None,
                )
                ws.run_forever()
            except Exception:
                pass
            time.sleep(3)  # reconnect after 3s

    def _on_message(self, ws, raw):
        try:
            data = json.loads(raw)
        except Exception:
            return

        t, v = data.get("type"), data.get("value")
        conf  = data.get("confidence")

        if t == "eyes":
            self._eyes = v
        elif t == "posture":
            self._posture = v

        if t in ("eyes", "posture"):
            if t == "eyes":
                detail = f"EAR={conf:.3f}" if conf is not None else ""
                line = f"[eyes   ] {v} ({detail})" if detail else f"[eyes   ] {v}"
            else:
                detail = f"conf={conf:.2f}" if conf is not None else ""
                line = f"[posture] {v} ({detail})" if detail else f"[posture] {v}"

            self._log.insert(0, line)
            self._log = self._log[:8]
            self._refresh_ui()

    # ------------------------------------------------------------------
    def _refresh_ui(self):
        eyes    = self._eyes
        posture = self._posture

        # Menu bar title
        eye_glyph     = "👁️ " if eyes == "open"   else "😴" if eyes == "closed" else "👀" if eyes == "away" else "👁️ "
        posture_glyph = "" if posture == "good" else "⚠️ " if posture == "bad"  else ""
        self.title = f"{eye_glyph}{posture_glyph}"

        # Dropdown rows
        self.eyes_item.title    = EYE_ICONS.get(eyes,    EYE_ICONS[None])
        self.posture_item.title = POSTURE_ICONS.get(posture, POSTURE_ICONS[None])

        for i, item in enumerate(self.log_items):
            item.title = self._log[i] if i < len(self._log) else ""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--session", type=int, required=True)
    args = parser.parse_args()
    MonitorApp(args.session).run()


if __name__ == "__main__":
    main()
