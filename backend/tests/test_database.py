import pytest
from sqlalchemy import text
from app.database import engine, get_db
from fastapi.testclient import TestClient

def test_postgresql_dialect_and_connectivity():
    """
    Ensure the configured engine connects to PostgreSQL (not SQLite)
    and executes a basic connectivity query.
    """
    assert engine.dialect.name == "postgresql", f"Expected 'postgresql', got {engine.dialect.name}"

    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1;")).scalar()
        assert result == 1, "Expected SELECT 1 to return scalar 1"

def test_database_session_dependency():
    """
    Verify that the get_db session dependency generates a live Session,
    connects to the expected database, and can be cleanly closed.
    """
    gen = get_db()
    session = next(gen)
    try:
        # Check current connected database name
        db_name = session.execute(text("SELECT current_database();")).scalar()
        assert db_name == "stockwise_db", f"Expected 'stockwise_db', connected to '{db_name}'"

        # Check postgres version
        version = session.execute(text("SELECT version();")).scalar()
        assert "PostgreSQL" in version, f"Expected PostgreSQL server, got: {version}"
    finally:
        # Trigger session closure in generator
        try:
            next(gen)
        except StopIteration:
            pass

def test_health_endpoint_reflects_db_status(client: TestClient):
    """
    Ensure the HTTP /api/v1/health endpoint connects to PostgreSQL
    and returns status: ok with database: connected.
    """
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"
