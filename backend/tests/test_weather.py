from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["system"] == "FasalRakshak 2.0 Backend Core"

def test_weather_endpoint():
    response = client.get("/api/weather?lat=17.9784&lon=79.5941")
    assert response.status_code == 200
    data = response.json()
    assert "daily_forecasts" in data
    assert len(data["daily_forecasts"]) > 0
    assert "temp_max" in data["daily_forecasts"][0]
