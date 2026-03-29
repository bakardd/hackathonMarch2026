.PHONY: install backend frontend camera test

install:
	cd backend && pip install -r requirements.txt
	cd camera-service && pip install -r requirements.txt
	cd frontend && npm install

backend:
	cd backend && uvicorn main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

electron:
	cd frontend && npm run electron

camera:
	@echo "Usage: make camera SESSION=<session_id> [CAMERA=0]"
	cd camera-service && python main.py --session $(SESSION) --camera $(or $(CAMERA),0)

test:
	cd backend && python -m pytest tests/ -v

seed:
	curl -s -X POST http://localhost:8000/sessions/start \
		-H "Content-Type: application/json" \
		-d '{"goal_text":"Demo session","duration_minutes":25}' | python3 -m json.tool
