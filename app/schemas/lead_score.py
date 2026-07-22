from pydantic import BaseModel, Field


class LeadScoreResponse(BaseModel):
    lead_id: int
    score: int = Field(ge=0, le=100)
    qualification: str
    crm_stage: str
    recommended_action: str
    reasons: list[str]