import cv2
import json
import requests
import threading
import time
import argparse
import os
import urllib.request

import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

API_URL = "http://localhost:8000/events/"

POSE_MODEL = "pose_landmarker_lite.task"
FACE_MODEL = "face_landmarker.task"

MODELS = {
    POSE_MODEL: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
    FACE_MODEL: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
}


class Stats:
    """Tracks cumulative time in each eye/posture state."""

    def __init__(self):
        self._lock = threading.Lock()
        self.start_time = time.time()

        self._eye_state: str | None = None
        self._eye_since: float = time.time()

        self._posture_state: str | None = None
        self._posture_since: float = time.time()

        self.eye_seconds: dict[str, float] = {"open": 0.0, "closed": 0.0, "away": 0.0}
        self.posture_seconds: dict[str, float] = {"good": 0.0, "bad": 0.0}

    def update_eyes(self, state: str):
        with self._lock:
            now = time.time()
            if self._eye_state in self.eye_seconds:
                self.eye_seconds[self._eye_state] += now - self._eye_since
            self._eye_state = state
            self._eye_since = now

    def update_posture(self, state: str):
        with self._lock:
            now = time.time()
            if self._posture_state in self.posture_seconds:
                self.posture_seconds[self._posture_state] += now - self._posture_since
            self._posture_state = state
            self._posture_since = now

    def summary(self) -> str:
        # Flush current states before printing
        self.update_eyes(self._eye_state or "open")
        self.update_posture(self._posture_state or "good")

        total = time.time() - self.start_time
        if total < 1:
            return "No data collected."

        def fmt(s: float) -> str:
            m, sec = divmod(int(s), 60)
            return f"{m}m {sec:02d}s"

        def pct(s: float, of: float) -> str:
            return f"{s / of * 100:.1f}%" if of > 0 else "—"

        on      = self.eye_seconds["open"]
        closed  = self.eye_seconds["closed"]
        away    = self.eye_seconds["away"]
        eye_total = on + closed + away

        good = self.posture_seconds["good"]
        bad  = self.posture_seconds["bad"]
        posture_total = good + bad

        lines = [
            "",
            "─" * 40,
            "  SESSION SUMMARY",
            "─" * 40,
            f"  Total time      {fmt(total)}",
            "",
            f"  Eyes on screen  {fmt(on)}  ({pct(on, eye_total)})",
            f"  Eyes away       {fmt(closed + away)}  ({pct(closed + away, eye_total)})",
            f"    closed        {fmt(closed)}",
            f"    looking away  {fmt(away)}",
            "",
            f"  Good posture    {fmt(good)}  ({pct(good, posture_total)})",
            f"  Bad posture     {fmt(bad)}  ({pct(bad, posture_total)})",
            "─" * 40,
            "",
        ]
        return "\n".join(lines)

    def to_dict(self) -> dict:
        self.update_eyes(self._eye_state or "open")
        self.update_posture(self._posture_state or "good")

        total = time.time() - self.start_time
        on     = self.eye_seconds["open"]
        closed = self.eye_seconds["closed"]
        away   = self.eye_seconds["away"]
        eye_total = on + closed + away

        good = self.posture_seconds["good"]
        bad  = self.posture_seconds["bad"]
        posture_total = good + bad

        def pct(n: float, of: float) -> float:
            return round(n / of * 100, 1) if of > 0 else 0.0

        return {
            "total_s": round(total, 1),
            "eyes": {
                "on_screen_s":  round(on, 1),
                "closed_s":     round(closed, 1),
                "away_s":       round(away, 1),
                "away_total_s": round(closed + away, 1),
                "on_pct":       pct(on, eye_total),
                "away_pct":     pct(closed + away, eye_total),
            },
            "posture": {
                "good_s":   round(good, 1),
                "bad_s":    round(bad, 1),
                "good_pct": pct(good, posture_total),
                "bad_pct":  pct(bad, posture_total),
            },
        }

    def export(self, session_id: int):
        data = self.to_dict()
        # Write to /tmp so the backend can always find it
        path = f"/tmp/session_{session_id}_stats.json"
        with open(path, "w") as f:
            json.dump(data, f, indent=2)
        print(f"Stats written to {path}")
        # POST to backend
        try:
            requests.post(
                f"http://localhost:8000/analytics/{session_id}/camera-stats",
                json=data,
                timeout=3,
            )
        except Exception:
            pass


def ensure_models():
    for filename, url in MODELS.items():
        if not os.path.exists(filename):
            print(f"Downloading {filename}...")
            urllib.request.urlretrieve(url, filename)
            print(f"  Done.")


def analyze_posture(landmarks) -> tuple[str, float]:
    left_sh  = landmarks[11]
    right_sh = landmarks[12]
    nose     = landmarks[0]
    shoulder_slope = abs(left_sh.y - right_sh.y)
    shoulder_mid_y = (left_sh.y + right_sh.y) / 2
    head_height    = shoulder_mid_y - nose.y
    bad = shoulder_slope > 0.05 or head_height < 0.15
    conf = round(max(0.0, 1.0 - shoulder_slope * 10), 2)
    return ("bad" if bad else "good"), conf


def analyze_head_yaw(lm) -> float:
    """
    Returns yaw ratio in [-1, 1].
    0 = centered, +/-1 = fully turned left/right.
    Uses nose tip (1) relative to eye outer corners (33, 263).
    """
    nose      = lm[1]
    left_eye  = lm[33]
    right_eye = lm[263]
    left_dist  = nose.x - left_eye.x
    right_dist = right_eye.x - nose.x
    total = left_dist + right_dist
    if total < 1e-4:
        return 0.0
    return (left_dist - right_dist) / total   # positive = turned right


def analyze_eyes(face_landmarks) -> tuple[str, float]:
    lm = face_landmarks
    try:
        # --- blink: Eye Aspect Ratio ---
        top    = lm[159]
        bottom = lm[145]
        left   = lm[33]
        right  = lm[133]
        h = abs(top.y - bottom.y)
        w = abs(left.x - right.x) + 1e-6
        ear = h / w
        if ear < 0.15:
            return "closed", round(ear, 3)

        # --- gaze: head yaw ---
        yaw = analyze_head_yaw(lm)
        if abs(yaw) > 0.25:          # ~25% asymmetry = clearly turned away
            return "away", round(abs(yaw), 3)

        return "open", round(ear, 3)
    except (IndexError, AttributeError):
        return "open", 0.0


def post_event(session_id, event_type, value, confidence=None):
    try:
        requests.post(API_URL, json={
            "session_id": session_id,
            "type": event_type,
            "value": value,
            "confidence": confidence,
        }, timeout=1)
    except Exception:
        pass


_switch_to: list[int | None] = [None]
_switch_lock = threading.Lock()


def _console_switcher():
    print("Type a camera number + Enter to switch (e.g. 1).")
    while True:
        try:
            line = input().strip()
            if line.isdigit():
                with _switch_lock:
                    _switch_to[0] = int(line)
        except EOFError:
            break

threading.Thread(target=_console_switcher, daemon=True).start()


def run(session_id: int, camera_index: int = 0):
    ensure_models()

    stats = Stats()

    pose_landmarker = mp_vision.PoseLandmarker.create_from_options(
        mp_vision.PoseLandmarkerOptions(
            base_options=mp_python.BaseOptions(model_asset_path=POSE_MODEL),
            running_mode=mp_vision.RunningMode.IMAGE,
        )
    )

    face_landmarker = mp_vision.FaceLandmarker.create_from_options(
        mp_vision.FaceLandmarkerOptions(
            base_options=mp_python.BaseOptions(model_asset_path=FACE_MODEL),
            running_mode=mp_vision.RunningMode.IMAGE,
            num_faces=1,
        )
    )

    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        print(f"Error: could not open camera {camera_index}")
        return

    print(f"Camera service running for session {session_id} (camera {camera_index}). Press q or Ctrl+C to quit.")
    last_sent = 0
    SEND_INTERVAL = 2

    try:
        while True:
            with _switch_lock:
                req = _switch_to[0]
            if req is not None and req != camera_index:
                new_cap = cv2.VideoCapture(req)
                if new_cap.isOpened():
                    cap.release()
                    cap = new_cap
                    camera_index = req
                    print(f"[switch] camera {camera_index}")
                else:
                    print(f"[switch] failed to open camera {req}")
                    new_cap.release()
                with _switch_lock:
                    _switch_to[0] = None

            ret, frame = cap.read()
            if not ret:
                break

            now = time.time()
            if now - last_sent >= SEND_INTERVAL:
                last_sent = now
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

                pose_result = pose_landmarker.detect(mp_image)
                if pose_result.pose_landmarks:
                    posture, conf = analyze_posture(pose_result.pose_landmarks[0])
                    post_event(session_id, "posture", posture, conf)
                    stats.update_posture(posture)
                    print(f"[posture] {posture} (conf={conf})")

                face_result = face_landmarker.detect(mp_image)
                if face_result.face_landmarks:
                    eye_state, conf = analyze_eyes(face_result.face_landmarks[0])
                    post_event(session_id, "eyes", eye_state, conf)
                    stats.update_eyes(eye_state)
                    print(f"[eyes]    {eye_state} (conf={conf})")
                else:
                    post_event(session_id, "eyes", "away", 0.0)
                    stats.update_eyes("away")
                    print(f"[eyes]    away (no face)")

            cv2.imshow("Camera Monitor (press q to quit)", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    except KeyboardInterrupt:
        pass
    finally:
        cap.release()
        cv2.destroyAllWindows()
        pose_landmarker.close()
        face_landmarker.close()
        print(stats.summary())
        stats.export(session_id)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--session", type=int, required=True)
    parser.add_argument("--camera",  type=int, default=0)
    args = parser.parse_args()
    run(args.session, args.camera)
