from app.db.models import Lead


SERVICE_KEYWORDS = {
    "ai",
    "automation",
    "agent",
    "chatbot",
    "rag",
    "customer support",
    "sales",
    "workflow",
    "llm",
}


def score_lead(lead: Lead) -> dict:
    score = 0
    reasons = []

    if lead.budget is not None:
        if lead.budget >= 5000:
            score += 30
            reasons.append("Strong available budget")
        elif lead.budget >= 2000:
            score += 20
            reasons.append("Acceptable available budget")
        elif lead.budget >= 500:
            score += 10
            reasons.append("Limited available budget")

    if lead.timeline and lead.timeline.strip():
        score += 15
        reasons.append("Implementation timeline was provided")

    if lead.company_size is not None:
        if lead.company_size >= 20:
            score += 15
            reasons.append("Company size fits the target customer profile")
        elif lead.company_size >= 5:
            score += 10
            reasons.append("Company size is acceptable")
        else:
            score += 5
            reasons.append("Company is very small")

    problem = lead.problem.strip()

    if len(problem) >= 50:
        score += 20
        reasons.append("Business problem is clearly described")
    elif len(problem) >= 20:
        score += 10
        reasons.append("Business problem has some useful detail")

    problem_lower = problem.lower()

    if any(keyword in problem_lower for keyword in SERVICE_KEYWORDS):
        score += 20
        reasons.append("Lead requirement matches AI automation services")

    score = min(score, 100)

    if score >= 70:
        qualification = "qualified"
        crm_stage = "Qualified"
        recommended_action = "Book a discovery call"
    elif score >= 45:
        qualification = "needs_review"
        crm_stage = "Needs Review"
        recommended_action = "Request more qualification details"
    else:
        qualification = "unqualified"
        crm_stage = "Unqualified"
        recommended_action = "Add to nurture sequence"

    return {
        "lead_id": lead.id,
        "score": score,
        "qualification": qualification,
        "crm_stage": crm_stage,
        "recommended_action": recommended_action,
        "reasons": reasons,
    }