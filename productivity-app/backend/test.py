import unittest
import models

# For API testing
import requests

# For live camera input
import cv2
import numpy as np

BACKEND_URL = "http://localhost:8000"  # Change to your backend URL if different

class TestModels(unittest.TestCase):
	def test_sample(self):
		# Example: Replace with real tests
		self.assertTrue(hasattr(models, '__file__'))

	def test_goal_model(self):
		from datetime import datetime
		goal = models.Goal(text="Test goal", duration_minutes=25)
		self.assertEqual(goal.text, "Test goal")
		self.assertEqual(goal.duration_minutes, 25)
		self.assertIsInstance(goal.created_at, datetime)

	def test_session_model(self):
		session = models.Session(goal_id=1)
		self.assertEqual(session.goal_id, 1)
		self.assertIsNone(session.end_time)

	def test_event_model(self):
		event = models.Event(session_id=1, type="posture", value="bad")
		self.assertEqual(event.type, "posture")
		self.assertEqual(event.value, "bad")


class TestAPI(unittest.TestCase):
	def test_health_check(self):
		# Example: Test a health check endpoint
		response = requests.get(f"{BACKEND_URL}/health")
		self.assertEqual(response.status_code, 200)
		# Add more assertions as needed

if __name__ == '__main__':
	unittest.main()


# --- Live Camera Input Test ---
def test_live_camera():
	print("\n[INFO] Starting live camera test. Press 'q' to quit.")
	cap = cv2.VideoCapture(0)
	if not cap.isOpened():
		print("[ERROR] Could not open webcam.")
		return
	while True:
		ret, frame = cap.read()
		if not ret:
			print("[ERROR] Failed to grab frame.")
			break
		cv2.imshow('Live Camera Test', frame)
		# Example: send frame to backend (uncomment and implement as needed)
		# _, img_encoded = cv2.imencode('.jpg', frame)
		# response = requests.post(f"{BACKEND_URL}/your-endpoint", files={'file': img_encoded.tobytes()})
		# print(response.status_code, response.text)
		if cv2.waitKey(1) & 0xFF == ord('q'):
			break
	cap.release()
	cv2.destroyAllWindows()

# To run the live camera test, uncomment the line below:

# --- Run camera-service posture/focus detection from here ---
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../camera-service')))
try:
	import main as camera_main
except ImportError:
	camera_main = None

def run_camera_service_from_test():
	if camera_main is None:
		print("[ERROR] Could not import camera-service/main.py. Make sure dependencies are installed.")
		return
	try:
		session_id = int(input("Enter session ID for camera monitoring: "))
	except Exception:
		print("[ERROR] Invalid session ID.")
		return
	camera_main.run(session_id, camera_index=0)

# Uncomment to run the camera-service posture/focus detection from this script:
run_camera_service_from_test()
