from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class LeadCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    company: str = Field(min_length=2, max_length=150)

    industry: str | None = None
    company_size: int | None = Field(default=None, ge=1)
    budget: float | None = Field(default=None, ge=0)
    timeline: str | None = None

    problem: str = Field(min_length=10)
    source: str | None = None


class LeadResponse(LeadCreate):
    id: int
    status: str
    lead_score: int | None = None
    qualification: str | None = None
    recommended_action: str | None = None
    created_at: datetime
    detected_intent: str | None = None
    email_subject: str | None = None
    email_draft: str | None = None
    model_config = ConfigDict(from_attributes=True)