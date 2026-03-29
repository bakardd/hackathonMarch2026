import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session
from sqlmodel.pool import StaticPool
from database import get_session
from main import app

@pytest.fixture(name="client")
def client_fixture():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)

    def override_get_session():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    yield TestClient(app)
    app.dependency_overrides.clear()

def test_start_and_end_session(client):
    res = client.post("/sessions/start", json={"goal_text": "Test goal", "duration_minutes": 25})
    assert res.status_code == 200
    data = res.json()
    assert "session_id" in data

    session_id = data["session_id"]
    res2 = client.post(f"/sessions/{session_id}/end")
    assert res2.status_code == 200
    assert res2.json()["status"] == "ended"

def test_log_event(client):
    res = client.post("/sessions/start", json={"goal_text": "Focus", "duration_minutes": 30})
    session_id = res.json()["session_id"]

    event_res = client.post("/events/", json={
        "session_id": session_id,
        "type": "posture",
        "value": "bad",
        "confidence": 0.9,
    })
    assert event_res.status_code == 200
    assert "id" in event_res.json()

def test_analytics_summary(client):
    res = client.post("/sessions/start", json={"goal_text": "Analytics test", "duration_minutes": 10})
    session_id = res.json()["session_id"]

    for _ in range(3):
        client.post("/events/", json={"session_id": session_id, "type": "posture", "value": "bad"})
    for _ in range(2):
        client.post("/events/", json={"session_id": session_id, "type": "activity", "value": "distracted"})

    summary = client.get(f"/analytics/{session_id}/summary").json()
    assert summary["focus_score"] < 100
    assert summary["total_events"] == 5
