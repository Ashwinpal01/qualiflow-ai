from pydantic import BaseModel


class EmailDraftResponse(BaseModel):
    lead_id: int
    subject: str
    body: str
    generation_method: str