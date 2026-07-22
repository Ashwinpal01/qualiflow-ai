from pydantic import BaseModel


class ServiceMatchResponse(BaseModel):
    lead_id: int
    detected_intent: str
    service_name: str
    description: str
    starting_price: float
    delivery_time: str
    next_step: str