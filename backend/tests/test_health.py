from fastapi.testclient import TestClient

def test_health_check_endpoint(client: TestClient):
    """
    Test that the /api/v1/health endpoint returns 200 and valid JSON structure.
    """
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app_name"] == "StockWise AI"
    assert "version" in data
    assert "environment" in data

def test_root_endpoint(client: TestClient):
    """
    Test that the root endpoint returns 200 and helpful navigation links.
    """
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "StockWise AI" in data["message"]
    assert data["docs"] == "/docs"
    assert data["health"] == "/api/v1/health"

def test_swagger_docs_available(client: TestClient):
    """
    Test that the OpenAPI Swagger UI (/docs) is accessible.
    """
    response = client.get("/docs")
    assert response.status_code == 200
    assert "html" in response.headers.get("content-type", "")

def test_openapi_schema_available(client: TestClient):
    """
    Test that the OpenAPI JSON schema is generated correctly.
    """
    response = client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert data["info"]["title"] == "StockWise AI"
    assert "/api/v1/health" in data["paths"]
