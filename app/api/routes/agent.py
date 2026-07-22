from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.agent import AgentRunResponse
from app.services.agent_service import (
    process_lead_with_agent,
)
from app.services.lead_service import get_lead_by_id
from app.tools.knowledge_search import load_services


router = APIRouter(prefix="/agent")


@router.get("/services")
def get_services_catalog():
    try:
        return load_services()
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load services: {error}",
        ) from error


@router.post(
    "/process/{lead_id}",
    response_model=AgentRunResponse,
)
def process_lead(
    lead_id: int,
    db: Session = Depends(get_db),
):
    lead = get_lead_by_id(
        db=db,
        lead_id=lead_id,
    )

    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    try:
        return process_lead_with_agent(
            db=db,
            lead=lead,
        )

    except FileNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent processing failed: {error}",
        ) from error