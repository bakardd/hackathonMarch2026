from fastapi import APIRouter, Depends
from sqlmodel import Session
from database import get_session
from models import Event
from pydantic import BaseModel
from typing import Optional
from ws_manager import manager

router = APIRouter()

class EventRequest(BaseModel):
    session_id: int
    type: str
    value: str
    confidence: Optional[float] = None
    app_name: Optional[str] = None

@router.post("/")
async def log_event(req: EventRequest, db: Session = Depends(get_session)):
    event = Event(**req.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)

    # Broadcast to any connected WebSocket clients for this session
    await manager.broadcast(req.session_id, {
        "type": event.type,
        "value": event.value,
        "confidence": event.confidence,
        "app_name": event.app_name,
        "timestamp": event.timestamp.isoformat(),
    })

    return {"id": event.id}
