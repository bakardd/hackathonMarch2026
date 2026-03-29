.PHONY: install backend frontend electron camera menubar test seed

install:
	cd backend && pip install -r requirements.txt
	cd camera-service && pip install -r requirements.txt
	cd menu-bar && pip install -r requirements.txt
	cd frontend && npm install

backend:
	cd backend && uvicorn main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

electron:
	cd frontend && npm run electron

camera:
	@echo "Starting camera for SESSION=$(SESSION) CAMERA=$(or $(CAMERA),0)"
	cd camera-service && python main.py --session $(SESSION) --camera $(or $(CAMERA),0)

menubar:
	@echo "Starting menu bar for SESSION=$(SESSION)"
	cd menu-bar && python app.py --session $(SESSION)

test:
	cd backend && python -m pytest tests/ -v

seed:
	curl -s -X POST http://localhost:8000/sessions/start \
		-H "Content-Type: application/json" \
		-d '{"goal_text":"Demo session","duration_minutes":25}' | python3 -m json.tool
