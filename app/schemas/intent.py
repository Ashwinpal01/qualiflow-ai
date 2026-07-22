from pydantic import BaseModel


class IntentClassificationResponse(BaseModel):
    lead_id: int
    detected_intent: str
    classification_method: str