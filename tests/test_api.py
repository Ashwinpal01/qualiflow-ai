from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_agent_services_catalog():
    response = client.get("/api/agent/services")
    assert response.status_code == 200
    services = response.json()
    assert isinstance(services, dict)



def test_process_nonexistent_lead():
    response = client.post("/api/agent/process/999999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Lead not found"
