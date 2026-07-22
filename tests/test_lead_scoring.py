from app.db.models import Lead
from app.tools.lead_scoring import score_lead


def test_score_lead_qualified():
    lead = Lead(
        id=1,
        name="Test Lead",
        email="test@example.com",
        company="Acme Corp",
        budget=10000,
        timeline="1 month",
        company_size=50,
        problem="We need an AI agent for workflow automation in our sales team."
    )
    result = score_lead(lead)
    assert result["score"] >= 70
    assert result["qualification"] == "qualified"
    assert result["crm_stage"] == "Qualified"


def test_score_lead_unqualified():
    lead = Lead(
        id=2,
        name="Low Budget Lead",
        email="low@example.com",
        company="Small Biz",
        budget=100,
        timeline="",
        company_size=2,
        problem="Need general help"
    )
    result = score_lead(lead)
    assert result["score"] < 45
    assert result["qualification"] == "unqualified"
