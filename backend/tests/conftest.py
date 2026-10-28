import pytest
from fastapi.testclient import TestClient

from app.main import app

@pytest.fixture(scope="session")
def client():
    """
    Test client fixture for sending requests to FastAPI in tests.
    """
    with TestClient(app) as test_client:
        yield test_client
