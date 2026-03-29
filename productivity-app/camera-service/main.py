import cv2
import mediapipe as mp
import requests
import time
import math
import argparse
from ultralytics import YOLO

API_URL = "http://localhost:8000/events/"

mp_pose = mp.solutions.pose
mp_face_mesh = mp.solutions.face_mesh

# COCO class IDs for drink-related objects
DRINK_CLASSES = {
    39: "bottle",
    40: "wine glass",
    41: "cup",
    45: "bowl",
}

# Landmark indices for eye openness (MediaPipe Face Mesh)
LEFT_EYE_TOP = 159
LEFT_EYE_BOTTOM = 145
LEFT_EYE_LEFT = 33
LEFT_EYE_RIGHT = 133

def eye_aspect_ratio(landmarks, top, bottom, left, right):
    """Simple EAR to detect closed/open eyes."""
    h = abs(landmarks[top].y - landmarks[bottom].y)
    w = abs(landmarks[left].x - landmarks[right].x)
    return h / (w + 1e-6)

def analyze_posture(pose_landmarks):
    """
    Returns 'good' or 'bad' based on shoulder slope and head forward position.
    Uses normalized coordinates (0-1).
    """
    lm = pose_landmarks.landmark

    left_shoulder = lm[mp_pose.PoseLandmark.LEFT_SHOULDER]
    right_shoulder = lm[mp_pose.PoseLandmark.RIGHT_SHOULDER]
    nose = lm[mp_pose.PoseLandmark.NOSE]

    # Shoulder slope (should be near 0 for upright)
    slope = abs(left_shoulder.y - right_shoulder.y)

    # Head forward: nose x should be between shoulders
    shoulder_mid_x = (left_shoulder.x + right_shoulder.x) / 2
    head_offset = abs(nose.x - shoulder_mid_x)

    # Head height relative to shoulders (slouching = nose closer to shoulders)
    shoulder_mid_y = (left_shoulder.y + right_shoulder.y) / 2
    head_height = shoulder_mid_y - nose.y  # positive = head above shoulders

    bad = slope > 0.05 or head_height < 0.15
    return "bad" if bad else "good", round(1 - slope, 2)

def post_event(session_id, event_type, value, confidence=None):
    try:
        requests.post(API_URL, json={
            "session_id": session_id,
            "type": event_type,
            "value": value,
            "confidence": confidence,
        }, timeout=1)
    except Exception:
        pass  # Don't crash if backend is down

def run(session_id: int, camera_index: int = 0):
    cap = cv2.VideoCapture(camera_index)
    last_sent = 0
    last_yolo = 0
    SEND_INTERVAL = 2  # seconds between posture/eye events
    YOLO_INTERVAL = 3  # seconds between object detection runs (heavier)

    # Load YOLOv8 nano model (auto-downloads ~6 MB on first run)
    yolo_model = YOLO("yolov8n.pt")
    print("[yolo] YOLOv8n loaded — detecting bottles, cups, glasses, bowls")

    with mp_pose.Pose(min_detection_confidence=0.5) as pose, \
         mp_face_mesh.FaceMesh(min_detection_confidence=0.5, max_num_faces=1) as face_mesh:

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            now = time.time()

            # --- MediaPipe: posture + eyes (every SEND_INTERVAL) ---
            if now - last_sent >= SEND_INTERVAL:
                pose_result = pose.process(rgb)
                face_result = face_mesh.process(rgb)
                last_sent = now

                if pose_result.pose_landmarks:
                    posture, conf = analyze_posture(pose_result.pose_landmarks)
                    post_event(session_id, "posture", posture, conf)
                    print(f"[posture] {posture} ({conf})")

                if face_result.multi_face_landmarks:
                    lm = face_result.multi_face_landmarks[0].landmark
                    ear = eye_aspect_ratio(lm, LEFT_EYE_TOP, LEFT_EYE_BOTTOM, LEFT_EYE_LEFT, LEFT_EYE_RIGHT)
                    eye_state = "closed" if ear < 0.15 else "open"
                    post_event(session_id, "eyes", eye_state, round(ear, 2))
                    print(f"[eyes] {eye_state} (EAR={ear:.2f})")

            # --- YOLOv8: drink detection (every YOLO_INTERVAL) ---
            if now - last_yolo >= YOLO_INTERVAL:
                last_yolo = now
                results = yolo_model(frame, verbose=False)
                detected_drinks = []
                for r in results:
                    for box in r.boxes:
                        cls_id = int(box.cls[0])
                        if cls_id in DRINK_CLASSES:
                            conf_val = float(box.conf[0])
                            if conf_val >= 0.35:
                                detected_drinks.append((DRINK_CLASSES[cls_id], conf_val))

                if detected_drinks:
                    best = max(detected_drinks, key=lambda x: x[1])
                    post_event(session_id, "drinking", best[0], round(best[1], 2))
                    print(f"[drinking] {best[0]} detected (conf={best[1]:.2f})")
                else:
                    post_event(session_id, "drinking", "none", 1.0)

            # Optional: show frame for debugging
            cv2.imshow("Camera Monitor (press q to quit)", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--session", type=int, required=True, help="Session ID")
    parser.add_argument("--camera", type=int, default=0, help="Camera index (default 0)")
    args = parser.parse_args()
    run(args.session, args.camera)
