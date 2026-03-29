from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from datetime import datetime
from database import get_session
from models import Session as SessionModel, Goal
from pydantic import BaseModel

router = APIRouter()

class StartSessionRequest(BaseModel):
    goal_text: str
    duration_minutes: int

@router.post("/start")
def start_session(req: StartSessionRequest, db: Session = Depends(get_session)):
    goal = Goal(text=req.goal_text, duration_minutes=req.duration_minutes)
    db.add(goal)
    db.commit()
    db.refresh(goal)

    session = SessionModel(goal_id=goal.id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"session_id": session.id, "goal_id": goal.id}

@router.post("/{session_id}/end")
def end_session(session_id: int, db: Session = Depends(get_session)):
    session = db.get(SessionModel, session_id)
    if not session:
        return {"error": "Session not found"}
    session.end_time = datetime.utcnow()
    db.add(session)
    db.commit()
    return {"status": "ended"}

@router.get("/{session_id}")
def get_session_info(session_id: int, db: Session = Depends(get_session)):
    session = db.get(SessionModel, session_id)
    return session
