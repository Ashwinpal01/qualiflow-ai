from app.tools.knowledge_search import load_services, find_matching_service
from app.tools.intent_classifier import classify_lead_intent, keyword_fallback


def test_load_services():
    services = load_services()
    assert isinstance(services, dict)
    assert "ai_sales_agent" in services


def test_find_matching_service():
    service = find_matching_service("ai_sales_agent")
    assert service["detected_intent"] == "ai_sales_agent"
    assert "service_name" in service


def test_classify_intent_fallback():
    intent_data = classify_lead_intent("Random non-matching inquiry")
    assert isinstance(intent_data, dict)
    assert "intent" in intent_data

    fallback_intent = keyword_fallback("sales agent qualify leads")
    assert fallback_intent == "ai_sales_agent"

