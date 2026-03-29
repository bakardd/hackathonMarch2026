# Productivity Monitor

Real-time focus tracking using posture detection, eye monitoring, and desktop activity analysis.

## Stack
- **Backend**: FastAPI + SQLModel (SQLite)
- **Camera**: Python + MediaPipe
- **Frontend**: React + Vite + TypeScript + Tailwind
- **Desktop**: Electron (optional, adds OS-level app tracking)

## Quick Start

```bash
# 1. Install everything
make install

# If camera-service was installed earlier, refresh its Python deps after pulling:
# .venv/bin/pip install -r camera-service/requirements.txt --upgrade --force-reinstall

# 2. Start backend (terminal 1)
make backend

# 3. Start frontend (terminal 2)
make frontend

# 4. Start camera service (terminal 3) — needs a session ID
make camera SESSION=1

# 5. (Optional) Run as Electron desktop app instead of browser
make electron
```

## Run Tests
```bash
make test
```

## Team Ownership
| Person | Owns |
|--------|------|
| A | `backend/` — API, DB, models |
| B | `frontend/src/components/`, `pages/` — UI |
| C | `frontend/src/hooks/`, `store/`, `api/` — data layer |
| D | `backend/tests/`, CI, deployment, demo |
