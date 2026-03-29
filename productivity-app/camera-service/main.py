import cv2
import requests
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

def ensure_models():
    for filename, url in MODELS.items():
        if not os.path.exists(filename):
            print(f"Downloading {filename}...")
            urllib.request.urlretrieve(url, filename)
            print(f"  Done.")

def analyze_posture(landmarks) -> tuple[str, float]:
    # Indices: 11=left shoulder, 12=right shoulder, 0=nose
    left_sh  = landmarks[11]
    right_sh = landmarks[12]
    nose     = landmarks[0]

    shoulder_slope = abs(left_sh.y - right_sh.y)
    shoulder_mid_y = (left_sh.y + right_sh.y) / 2
    head_height    = shoulder_mid_y - nose.y  #positive = head above shoulders

    bad = shoulder_slope > 0.05 or head_height < 0.15
    conf = round(max(0.0, 1.0 - shoulder_slope * 10), 2)
    return ("bad" if bad else "good"), conf

def analyze_eyes(face_landmarks) -> tuple[str, float]:
    # Left eye: top=159, bottom=145, left=33, right=133
    lm = face_landmarks
    try:
        top    = lm[159]
        bottom = lm[145]
        left   = lm[33]
        right  = lm[133]
        h = abs(top.y - bottom.y)
        w = abs(left.x - right.x) + 1e-6
        ear = h / w
        state = "closed" if ear < 0.15 else "open"
        return state, round(ear, 3)
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

def run(session_id: int, camera_index: int = 0):
    ensure_models()

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

    print(f"Camera service running for session {session_id}. Press q to quit.")
    last_sent = 0
    SEND_INTERVAL = 2  # seconds between events

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        now = time.time()
        if now - last_sent >= SEND_INTERVAL:
            last_sent = now
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

            # Posture
            pose_result = pose_landmarker.detect(mp_image)
            if pose_result.pose_landmarks:
                posture, conf = analyze_posture(pose_result.pose_landmarks[0])
                post_event(session_id, "posture", posture, conf)
                print(f"[posture] {posture} (conf={conf})")

            # Eyes
            face_result = face_landmarker.detect(mp_image)
            if face_result.face_landmarks:
                eye_state, ear = analyze_eyes(face_result.face_landmarks[0])
                post_event(session_id, "eyes", eye_state, ear)
                print(f"[eyes]    {eye_state} (EAR={ear})")

        cv2.imshow("Camera Monitor (press q to quit)", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    pose_landmarker.close()
    face_landmarker.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--session", type=int, required=True)
    parser.add_argument("--camera",  type=int, default=0)
    args = parser.parse_args()
    run(args.session, args.camera)
