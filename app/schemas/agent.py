from pydantic import BaseModel


class AgentRunResponse(BaseModel):
    lead_id: int
    status: str
    lead_score: int
    qualification: str
    detected_intent: str
    matched_service: str
    recommended_action: str
    email_subject: str
    email_draft: str
    intent_classification_method: str
    email_generation_method: str