from typing import Literal, Optional

from pydantic import BaseModel, Field


UserRole = Literal["manager", "player", "viewer", "organizer"]


class FootballContext(BaseModel):
    season_id: Optional[int] = None
    competition_name: Optional[str] = None
    team_name: Optional[str] = None
    next_match: Optional[str] = None
    remaining_budget: Optional[float] = None


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    user_id: int
    user_role: UserRole
    username: str
    context: FootballContext = Field(default_factory=FootballContext)


class ChatResponse(BaseModel):
    answer: str