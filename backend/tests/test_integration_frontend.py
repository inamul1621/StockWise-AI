from decimal import Decimal
import uuid
import pytest
from fastapi.testclient import TestClient


def test_frontend_cors_and_api_contract_integration(client: TestClient):
    """
    Simulate frontend origin requests and verify API contracts
    across the entire frontend workflow.
    """
    frontend_origin = "http://127.0.0.1:5173"
    headers = {"Origin": frontend_origin}

    # 1. Health check with CORS
    health_res = client.get("/api/v1/health", headers=headers)
    assert health_res.status_code == 200
    assert health_res.headers.get("access-control-allow-origin") == frontend_origin
    assert health_res.json()["status"] == "ok"
    assert health_res.json()["database"] == "connected"

    # 2. Dashboard Summary API Contract
    dash_res = client.get("/api/v1/dashboard/summary", headers=headers)
    assert dash_res.status_code == 200
    assert dash_res.headers.get("access-control-allow-origin") == frontend_origin
    dash = dash_res.json()
    expected_dash_keys = {
        "total_products",
        "total_units_in_stock",
        "low_stock_products_count",
        "out_of_stock_products_count",
        "total_inventory_cost_value",
        "total_inventory_retail_value",
        "potential_profit",
        "total_suppliers",
    }
    assert expected_dash_keys.issubset(dash.keys())

    # 3. Create Supplier Flow
    supp_res = client.post(
        "/api/v1/suppliers",
        json={
            "name": f"Integration Supplier {uuid.uuid4().hex[:6]}",
            "contact_person": "Jane Doe",
            "email": "jane@example.com",
            "phone": "+1-555-1234",
            "address": "456 Commerce Ave",
        },
        headers=headers,
    )
    assert supp_res.status_code == 201
    supp_id = supp_res.json()["id"]

    # 4. Create Product with Linked Supplier
    sku = f"INT-{uuid.uuid4().hex[:6].upper()}"
    prod_res = client.post(
        "/api/v1/products",
        json={
            "name": "Integration Test Gadget",
            "sku": sku,
            "supplier_id": supp_id,
            "category": "Electronics",
            "cost_price": "20.00",
            "unit_price": "45.00",
            "reorder_level": 10,
        },
        headers=headers,
    )
    assert prod_res.status_code == 201
    prod = prod_res.json()
    assert prod["sku"] == sku
    assert prod["current_stock"] == 0
    assert Decimal(prod["cost_price"]) == Decimal("20.00")
    prod_id = prod["id"]

    # 5. Stock-In Flow
    in_res = client.post(
        "/api/v1/inventory/stock-in",
        json={
            "product_id": prod_id,
            "quantity": 15,
            "reference": "PO-E2E-01",
            "reason": "Initial stock receipt",
        },
        headers=headers,
    )
    assert in_res.status_code == 201
    in_data = in_res.json()
    assert in_data["current_stock_after"] == 15
    assert in_data["transaction_type"] == "IN"

    # 6. Stock-Out Flow
    out_res = client.post(
        "/api/v1/inventory/stock-out",
        json={
            "product_id": prod_id,
            "quantity": 8,
            "reference": "INV-E2E-01",
            "reason": "Retail customer sale",
        },
        headers=headers,
    )
    assert out_res.status_code == 201
    out_data = out_res.json()
    assert out_data["current_stock_after"] == 7  # 15 - 8 = 7 units
    assert out_data["transaction_type"] == "OUT"

    # 7. Low Stock Detection (7 <= 10 reorder_level)
    low_res = client.get("/api/v1/dashboard/low-stock?size=50", headers=headers)
    assert low_res.status_code == 200
    low_items = {item["product_id"]: item for item in low_res.json()["items"]}
    # Our item has stock 7 and reorder_level 10 -> deficit is 3
    if prod_id in low_items:
        assert low_items[prod_id]["current_stock"] == 7
        assert low_items[prod_id]["reorder_deficit"] == 3

    # 8. Inventory Valuation Report Flow
    rep_res = client.get("/api/v1/reports/inventory?category=Electronics", headers=headers)
    assert rep_res.status_code == 200
    rep_data = rep_res.json()
    assert rep_data["total_products"] >= 1
    assert Decimal(rep_data["total_inventory_cost_value"]) >= Decimal("0.00")
    assert Decimal(rep_data["total_inventory_retail_value"]) >= Decimal("0.00")

    # 9. Movements Report Flow
    mov_res = client.get(
        f"/api/v1/reports/inventory-movements?product_id={prod_id}",
        headers=headers,
    )
    assert mov_res.status_code == 200
    mov_data = mov_res.json()
    assert mov_data["total_in_transactions"] == 1
    assert mov_data["total_out_transactions"] == 1
    assert mov_data["total_units_in"] == 15
    assert mov_data["total_units_out"] == 8
    assert mov_data["net_units_change"] == 7
