from app.core.llm import call_llm


ALLOWED_INTENTS = {
    "ai_sales_agent",
    "customer_support_automation",
    "rag_document_chatbot",
    "workflow_automation",
    "data_extraction",
    "other",
}


def keyword_fallback(problem: str) -> str:
    """
    Fallback classifier used when the LLM API fails.
    """

    text = problem.lower()

    if any(
        phrase in text
        for phrase in [
            "sales agent",
            "qualify leads",
            "sales automation",
            "follow-up email",
            "crm",
        ]
    ):
        return "ai_sales_agent"

    if any(
        phrase in text
        for phrase in [
            "customer support",
            "support chatbot",
            "support tickets",
            "customer service",
        ]
    ):
        return "customer_support_automation"

    if any(
        phrase in text
        for phrase in [
            "rag",
            "pdf chatbot",
            "document chatbot",
            "company documents",
            "knowledge base",
        ]
    ):
        return "rag_document_chatbot"

    if any(
        phrase in text
        for phrase in [
            "workflow",
            "business process",
            "task automation",
            "approval process",
        ]
    ):
        return "workflow_automation"

    if any(
        phrase in text
        for phrase in [
            "extract data",
            "invoice processing",
            "document extraction",
            "ocr",
        ]
    ):
        return "data_extraction"

    return "other"


def classify_lead_intent(problem: str) -> dict:
    """
    Use the LLM to classify the lead's business requirement.
    Fall back to keyword rules if the LLM fails.
    """

    system_prompt = """
You classify incoming sales leads for an AI development company.

Return exactly one of these labels:

ai_sales_agent
customer_support_automation
rag_document_chatbot
workflow_automation
data_extraction
other

Do not return an explanation.
"""

    user_prompt = f"""
Classify this customer requirement:

{problem}
"""

    try:
        llm_result = call_llm(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )

        normalized_intent = llm_result.strip().lower()

        if normalized_intent in ALLOWED_INTENTS:
            return {
                "intent": normalized_intent,
                "classification_method": "llm",
            }

    except Exception:
        pass

    return {
        "intent": keyword_fallback(problem),
        "classification_method": "keyword_fallback",
    }