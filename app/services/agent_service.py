from sqlalchemy.orm import Session

from app.db.models import Lead
from app.tools.email_generator import generate_sales_email
from app.tools.intent_classifier import classify_lead_intent
from app.tools.knowledge_search import find_matching_service
from app.tools.lead_scoring import score_lead


def process_lead_with_agent(
    db: Session,
    lead: Lead,
) -> dict:
    """
    Run the complete AI sales workflow for one lead.
    """

    try:
        # Step 1: Understand what the lead wants
        intent_result = classify_lead_intent(
            lead.problem
        )

        detected_intent = intent_result["intent"]

        # Step 2: Score and qualify the lead
        score_result = score_lead(lead)

        # Step 3: Match the lead with an approved service
        service_result = find_matching_service(
            detected_intent
        )

        # Step 4: Generate a personalized email
        email_result = generate_sales_email(
            lead_name=lead.name,
            company=lead.company,
            problem=lead.problem,
            qualification=score_result["qualification"],
            lead_score=score_result["score"],
            recommended_action=score_result[
                "recommended_action"
            ],
            service=service_result,
        )

        # Step 5: Save all results to the lead
        lead.detected_intent = detected_intent

        lead.lead_score = score_result["score"]
        lead.qualification = score_result[
            "qualification"
        ]
        lead.status = score_result["crm_stage"]
        lead.recommended_action = score_result[
            "recommended_action"
        ]

        lead.email_subject = email_result["subject"]
        lead.email_draft = email_result["body"]

        db.add(lead)
        db.commit()
        db.refresh(lead)

        return {
            "lead_id": lead.id,
            "status": lead.status,
            "lead_score": lead.lead_score,
            "qualification": lead.qualification,
            "detected_intent": lead.detected_intent,
            "matched_service": service_result[
                "service_name"
            ],
            "recommended_action": (
                lead.recommended_action
            ),
            "email_subject": lead.email_subject,
            "email_draft": lead.email_draft,
            "intent_classification_method": (
                intent_result["classification_method"]
            ),
            "email_generation_method": email_result[
                "generation_method"
            ],
        }

    except Exception:
        db.rollback()
        raise