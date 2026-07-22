from datetime import datetime, timezone

from sqlalchemy import Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, Float, DateTime, Text
from app.db.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True
    )

    company: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    industry: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    company_size: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    budget: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    timeline: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    problem: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    source: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="new",
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    lead_score: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )
    
    detected_intent: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    
    qualification: Mapped[str | None] = mapped_column(  
        String(50),
        nullable=True
    )

    recommended_action: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )
    email_subject: Mapped[str | None] = mapped_column(
    String(255),
    nullable=True,
    )

    email_draft: Mapped[str | None] = mapped_column(
    Text,
    nullable=True,
    )