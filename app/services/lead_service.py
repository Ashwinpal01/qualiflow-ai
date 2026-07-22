from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Lead
from app.schemas.lead import LeadCreate


def create_lead(
    db: Session,
    lead_data: LeadCreate
) -> Lead:
    lead = Lead(
        **lead_data.model_dump()
    )

    db.add(lead)
    db.commit()
    db.refresh(lead)

    return lead


def get_all_leads(db: Session) -> list[Lead]:
    statement = select(Lead).order_by(
        Lead.created_at.desc()
    )

    leads = db.scalars(statement).all()

    return list(leads)


def get_lead_by_id(
    db: Session,
    lead_id: int
) -> Lead | None:
    return db.get(Lead, lead_id)


def delete_all_leads(db: Session) -> None:
    db.query(Lead).delete()
    db.commit()