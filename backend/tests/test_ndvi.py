from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_ndvi_heatmap_endpoint():
    response = client.get("/api/ndvi/heatmap?lat=17.9784&lon=79.5941&crop_type=cotton")
    assert response.status_code == 200
    data = response.json()
    assert "ndvi_matrix" in data
    assert len(data["ndvi_matrix"]) == 25
    assert "health_status" in data
    assert "ndvi_mean" in data

def test_ndvi_history_endpoint():
    response = client.get("/api/ndvi/history?plot_id=plot-101&weeks=8")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 8
    assert "ndvi_mean" in data[0]
