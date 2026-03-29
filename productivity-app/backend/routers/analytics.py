from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from database import get_session
from models import Event
from pydantic import BaseModel
from typing import Any

router = APIRouter()

# In-memory store for camera-reported final stats
_camera_stats: dict[int, dict] = {}


class CameraStats(BaseModel):
    total_s: float
    eyes: dict[str, Any]
    posture: dict[str, Any]


@router.post("/{session_id}/camera-stats")
def post_camera_stats(session_id: int, stats: CameraStats):
    _camera_stats[session_id] = stats.model_dump()
    return {"ok": True}


@router.get("/{session_id}/camera-stats")
def get_camera_stats(session_id: int):
    import os, json as _json
    if session_id in _camera_stats:
        return _camera_stats[session_id]
    path = f"/tmp/session_{session_id}_stats.json"
    if os.path.exists(path):
        with open(path) as f:
            data = _json.load(f)
        _camera_stats[session_id] = data
        return data
    return None

@router.get("/{session_id}/summary")
def get_summary(session_id: int, db: Session = Depends(get_session)):
    events = db.exec(select(Event).where(Event.session_id == session_id)).all()

    total = len(events)
    if total == 0:
        return {"focus_score": 100, "events": [], "breakdown": {}}

    breakdown = {}
    for e in events:
        breakdown.setdefault(e.type, {}).setdefault(e.value, 0)
        breakdown[e.type][e.value] += 1

    # Simple scoring heuristic
    score = 100
    posture_bad = breakdown.get("posture", {}).get("bad", 0)
    eyes_away = breakdown.get("eyes", {}).get("away", 0)
    distracted = breakdown.get("activity", {}).get("distracted", 0)
    idle = breakdown.get("idle", {}).get("true", 0)

    score -= min(posture_bad * 2, 20)
    score -= min(eyes_away * 2, 20)
    score -= min(distracted * 3, 30)
    score -= min(idle * 2, 20)

    return {
        "focus_score": max(score, 0),
        "total_events": total,
        "breakdown": breakdown,
        "events": [
            {"type": e.type, "value": e.value, "timestamp": e.timestamp.isoformat()}
            for e in events[-50:]  # last 50 for timeline
        ]
    }


@router.get("/{session_id}/time-stats")
def get_time_stats(session_id: int, db: Session = Depends(get_session)):
    from models import Session as SessionModel
    from datetime import datetime

    session = db.get(SessionModel, session_id)
    if not session:
        return {"error": "Session not found"}

    now = datetime.utcnow()
    session_end = session.end_time or now

    events = db.exec(
        select(Event)
        .where(Event.session_id == session_id)
        .where(Event.type.in_(["eyes", "posture"]))
        .order_by(Event.timestamp)
    ).all()

    def calc_durations(type_: str) -> dict[str, float]:
        typed = [e for e in events if e.type == type_]
        if not typed:
            return {}

        durations: dict[str, float] = {}
        for i, ev in enumerate(typed):
            next_ts = typed[i + 1].timestamp if i + 1 < len(typed) else session_end
            delta = (next_ts - ev.timestamp).total_seconds()
            delta = max(0.0, delta)
            durations[ev.value] = durations.get(ev.value, 0.0) + delta

        return durations

    eyes    = calc_durations("eyes")
    posture = calc_durations("posture")

    eyes_on     = eyes.get("open", 0.0)
    eyes_closed = eyes.get("closed", 0.0)
    eyes_away   = eyes.get("away", 0.0)
    eyes_total  = eyes_on + eyes_closed + eyes_away

    pos_good  = posture.get("good", 0.0)
    pos_bad   = posture.get("bad", 0.0)
    pos_total = pos_good + pos_bad

    def pct(n: float, total: float) -> float:
        return round(n / total * 100, 1) if total > 0 else 0.0

    def s(v: float) -> int:
        return int(round(v))

    return {
        "eyes": {
            "on_screen_s":  s(eyes_on),
            "closed_s":     s(eyes_closed),
            "away_s":       s(eyes_away),
            "away_total_s": s(eyes_closed + eyes_away),
            "on_pct":       pct(eyes_on, eyes_total),
            "away_pct":     pct(eyes_closed + eyes_away, eyes_total),
        },
        "posture": {
            "good_s":   s(pos_good),
            "bad_s":    s(pos_bad),
            "good_pct": pct(pos_good, pos_total),
            "bad_pct":  pct(pos_bad, pos_total),
        },
    }
