from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class Goal(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    text: str
    duration_minutes: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Session(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    goal_id: Optional[int] = Field(default=None, foreign_key="goal.id")
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    focus_score: Optional[float] = None

class Event(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="session.id")
    # type: "posture" | "eyes" | "activity" | "idle" | "checkin"
    type: str
    value: str       # e.g. "bad", "away", "distracted", "yes"
    confidence: Optional[float] = None
    app_name: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
