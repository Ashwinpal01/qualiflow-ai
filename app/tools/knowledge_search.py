import json
from pathlib import Path


SERVICES_FILE = Path("data/knowledge_base/services.json")


def load_services() -> dict:
    if not SERVICES_FILE.exists():
        raise FileNotFoundError(
            f"Service knowledge base not found: {SERVICES_FILE}"
        )

    with SERVICES_FILE.open(
        "r",
        encoding="utf-8"
    ) as file:
        return json.load(file)


def find_matching_service(detected_intent: str) -> dict:
    services = load_services()

    service = services.get(
        detected_intent,
        services["other"]
    )

    return {
        "detected_intent": detected_intent,
        **service
    }