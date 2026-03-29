from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from database import get_session
from models import Event

router = APIRouter()

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
