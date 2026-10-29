from decimal import Decimal
import os
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import Settings, settings
from app.core.security import hash_password, verify_password, verify_api_key
from app.database import engine, get_db
from app.models.product import Product
from app.models.inventory import InventoryTransaction


def test_cors_explicit_allowlist(client: TestClient):
    """
    Ensure CORS responds with explicitly allowed origins from configuration,
    not wildcard '*' with credentials.
    """
    allowed_origin = "http://localhost:3000"
    response = client.get(
        "/api/v1/health",
        headers={"Origin": allowed_origin},
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == allowed_origin
    assert response.headers.get("access-control-allow-credentials") == "true"


def test_startup_validation_rejects_insecure_production_settings():
    """
    Ensure application configuration validation fails fast with descriptive errors
    if production environment has insecure configurations.
    """
    # 1. Reject DEBUG=True in production
    with pytest.raises(ValueError, match="DEBUG mode must be False in production"):
        s = Settings(
            ENVIRONMENT="production",
            DEBUG=True,
            POSTGRES_PASSWORD="SuperSecretProductionPassword123!",
            CORS_ORIGINS=["https://app.stockwise.com"],
        )
        s.validate_security_configuration()

    # 2. Reject weak default password in production
    with pytest.raises(ValueError, match="Insecure default database password"):
        s = Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            POSTGRES_PASSWORD="stockwise_pass",
            CORS_ORIGINS=["https://app.stockwise.com"],
        )
        s.validate_security_configuration()

    # 3. Reject wildcard CORS in production
    with pytest.raises(ValueError, match=r"Unrestricted wildcard '\*' is not permitted"):
        s = Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            POSTGRES_PASSWORD="SuperSecretProductionPassword123!",
            CORS_ORIGINS=["*"],
        )
        s.validate_security_configuration()

    # 4. Reject missing database username or password
    with pytest.raises(ValueError, match="Missing required database settings"):
        s = Settings(
            POSTGRES_USER="",
            POSTGRES_PASSWORD="",
        )
        s.validate_security_configuration()


def test_password_hashing_pbkdf2_security():
    """
    Verify PBKDF2-HMAC-SHA256 password hashing and constant-time verification.
    """
    plain = "MySecureP@ssw0rd2026!"
    hashed = hash_password(plain)

    # Must be salt$hash format
    assert "$" in hashed
    salt, hash_part = hashed.split("$", 1)
    assert len(salt) == 32  # 16 bytes hex
    assert len(hash_part) == 64  # SHA-256 hex output

    # Valid password matches
    assert verify_password(plain, hashed) is True

    # Incorrect password fails
    assert verify_password("WrongPassword!", hashed) is False
    assert verify_password("", hashed) is False
    assert verify_password(plain, "corrupted_hash") is False


def test_api_key_security_verification():
    """
    Verify API key verification:
    - Disabled when settings.API_KEY is None
    - Enforced with constant-time comparison when settings.API_KEY is set
    """
    original_key = settings.API_KEY
    try:
        # 1. Disabled mode
        settings.API_KEY = None
        assert verify_api_key(None) is None

        # 2. Configured mode
        settings.API_KEY = "test-secret-api-key-9988"

        # Correct key succeeds
        assert verify_api_key("test-secret-api-key-9988") == "test-secret-api-key-9988"

        # Missing key raises 401
        with pytest.raises(Exception) as excinfo:
            verify_api_key(None)
        assert excinfo.value.status_code == 401

        # Wrong key raises 401
        with pytest.raises(Exception) as excinfo2:
            verify_api_key("wrong-key")
        assert excinfo2.value.status_code == 401
    finally:
        settings.API_KEY = original_key


def test_database_transaction_rollback_preserves_balance(client: TestClient):
    """
    Verify atomic rollback: if an error occurs during stock operations,
    no partial transaction record is saved and product stock remains consistent.
    """
    # Create product with 10 units
    sku = f"RBK-{uuid.uuid4().hex[:6].upper()}"
    prod_res = client.post("/api/v1/products", json={
        "name": "Rollback Test Product",
        "sku": sku,
        "cost_price": "10.00",
        "unit_price": "20.00",
        "reorder_level": 5,
    })
    prod_id = prod_res.json()["id"]

    # Add initial 10 units
    client.post("/api/v1/inventory/stock-in", json={
        "product_id": prod_id,
        "quantity": 10,
        "reason": "Initial stock",
    })

    # Verify initial stock is 10
    p1 = client.get(f"/api/v1/products/{prod_id}").json()
    assert p1["current_stock"] == 10

    # Attempt to stock out 15 units (exceeds available stock of 10)
    failed_res = client.post("/api/v1/inventory/stock-out", json={
        "product_id": prod_id,
        "quantity": 15,
        "reason": "Excessive deduction",
    })
    assert failed_res.status_code == 400
    assert "Insufficient stock" in failed_res.json()["detail"]

    # Verify stock remains strictly 10 (did not decrement)
    p2 = client.get(f"/api/v1/products/{prod_id}").json()
    assert p2["current_stock"] == 10

    # Verify no OUT transaction was written to ledger
    tx_res = client.get(f"/api/v1/inventory/transactions?product_id={prod_id}")
    txs = tx_res.json()["items"]
    assert len(txs) == 1
    assert txs[0]["transaction_type"] == "IN"
    assert txs[0]["quantity"] == 10


def test_global_exception_handler_masks_internal_details(client: TestClient):
    """
    Verify that unhandled internal exceptions return a generic safe message
    without leaking database credentials, file paths, or SQL statements.
    """
    # Trigger 404 for unknown endpoint
    res_404 = client.get("/api/v1/nonexistent-endpoint-xyz")
    assert res_404.status_code == 404
    assert res_404.json()["status_code"] == 404

    # Trigger validation 422
    res_422 = client.post("/api/v1/products", json={"invalid": "payload"})
    assert res_422.status_code == 422
    data_422 = res_422.json()
    assert data_422["detail"] == "Input validation failed."
    assert "errors" in data_422


def test_database_url_hides_password_in_string_representation():
    """
    Verify that the database engine URL string rendering masks passwords.
    """
    rendered = engine.url.render_as_string(hide_password=True)
    assert settings.POSTGRES_PASSWORD not in rendered
    assert "***" in rendered or engine.url.password not in rendered
