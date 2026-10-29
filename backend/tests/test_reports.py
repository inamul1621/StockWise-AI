from datetime import date, timedelta
from decimal import Decimal
import uuid
import pytest
from fastapi.testclient import TestClient


def unique_sku(prefix="RPT"):
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"


def test_empty_database_summary_and_reports(client: TestClient):
    """
    Ensure summary and reports handle empty database cleanly without
    ZeroDivisionError or 500 errors.
    """
    # 1. Summary
    res_summary = client.get("/api/v1/dashboard/summary")
    assert res_summary.status_code == 200
    summary = res_summary.json()
    assert summary["total_products"] >= 0
    assert summary["total_units_in_stock"] >= 0
    assert float(summary["total_inventory_cost_value"]) >= 0.0
    assert float(summary["total_inventory_retail_value"]) >= 0.0

    # 2. Low-stock
    res_low = client.get("/api/v1/dashboard/low-stock")
    assert res_low.status_code == 200
    assert isinstance(res_low.json()["items"], list)

    # 3. Inventory Report
    res_inv = client.get("/api/v1/reports/inventory")
    assert res_inv.status_code == 200
    assert isinstance(res_inv.json()["items"], list)

    # 4. Movements Report
    res_mov = client.get("/api/v1/reports/inventory-movements")
    assert res_mov.status_code == 200
    assert isinstance(res_mov.json()["product_breakdowns"], list)


def test_dashboard_summary_and_low_stock_mathematical_accuracy(client: TestClient):
    """
    Create products with strictly known cost prices, unit prices, and stock movements,
    then mathematically verify every aggregated total.
    """
    # 1. Create a Supplier
    supp_res = client.post("/api/v1/suppliers", json={
        "name": f"Analytics Supplier {uuid.uuid4().hex[:6]}",
        "email": f"analytics_{uuid.uuid4().hex[:6]}@example.com",
    })
    assert supp_res.status_code == 201
    supplier_id = supp_res.json()["id"]

    # 2. Create 3 products
    # Prod A: Adequate stock
    sku_a = unique_sku("A")
    res_a = client.post("/api/v1/products", json={
        "name": "Widget Alpha",
        "sku": sku_a,
        "supplier_id": supplier_id,
        "category": "Widgets",
        "cost_price": "10.00",
        "unit_price": "25.00",
        "reorder_level": 5,
    })
    assert res_a.status_code == 201
    prod_a_id = res_a.json()["id"]

    # Prod B: Low stock (current_stock <= reorder_level)
    sku_b = unique_sku("B")
    res_b = client.post("/api/v1/products", json={
        "name": "Gadget Beta",
        "sku": sku_b,
        "supplier_id": supplier_id,
        "category": "Gadgets",
        "cost_price": "30.00",
        "unit_price": "50.00",
        "reorder_level": 10,
    })
    assert res_b.status_code == 201
    prod_b_id = res_b.json()["id"]

    # Prod C: Out of stock (current_stock == 0)
    sku_c = unique_sku("C")
    res_c = client.post("/api/v1/products", json={
        "name": "Tool Gamma",
        "sku": sku_c,
        "supplier_id": supplier_id,
        "category": "Tools",
        "cost_price": "15.00",
        "unit_price": "40.00",
        "reorder_level": 8,
    })
    assert res_c.status_code == 201
    prod_c_id = res_c.json()["id"]

    # 3. Add inventory
    # Prod A: stock in 20 units -> current_stock = 20 (> 5, IN_STOCK)
    client.post("/api/v1/inventory/stock-in", json={
        "product_id": prod_a_id,
        "quantity": 20,
        "reason": "Initial batch A",
    })

    # Prod B: stock in 6 units -> current_stock = 6 (<= 10, LOW_STOCK)
    client.post("/api/v1/inventory/stock-in", json={
        "product_id": prod_b_id,
        "quantity": 6,
        "reason": "Initial batch B",
    })

    # Prod C: stays at 0 units -> (<= 8 and == 0, LOW_STOCK & OUT_OF_STOCK)

    # 4. Verify low-stock list across pages
    all_low_items = {}
    page = 1
    while True:
        res_low = client.get(f"/api/v1/dashboard/low-stock?page={page}&size=50")
        assert res_low.status_code == 200
        pdata = res_low.json()
        for item in pdata["items"]:
            all_low_items[item["product_id"]] = item
        if page >= pdata["pages"] or not pdata["items"]:
            break
        page += 1

    # Prod C must be present (stock 0, reorder_level 8 -> deficit 8)
    assert prod_c_id in all_low_items
    assert all_low_items[prod_c_id]["current_stock"] == 0
    assert all_low_items[prod_c_id]["reorder_level"] == 8
    assert all_low_items[prod_c_id]["reorder_deficit"] == 8

    # Prod B must be present (stock 6, reorder_level 10 -> deficit 4)
    assert prod_b_id in all_low_items
    assert all_low_items[prod_b_id]["current_stock"] == 6
    assert all_low_items[prod_b_id]["reorder_level"] == 10
    assert all_low_items[prod_b_id]["reorder_deficit"] == 4

    # Prod A must NOT be in low-stock (stock 20 > reorder_level 5)
    assert prod_a_id not in all_low_items

    # 5. Check Inventory Report specifically for these products across pages
    all_rep_items = {}
    page = 1
    while True:
        res_rep = client.get(f"/api/v1/reports/inventory?page={page}&size=50")
        assert res_rep.status_code == 200
        rep_data = res_rep.json()
        for item in rep_data["items"]:
            all_rep_items[item["product_id"]] = item
        if page >= rep_data["pages"] or not rep_data["items"]:
            break
        page += 1

    # Verify Prod A item calculations
    item_a = all_rep_items[prod_a_id]
    assert item_a["current_stock"] == 20
    assert Decimal(item_a["cost_price"]) == Decimal("10.00")
    assert Decimal(item_a["unit_price"]) == Decimal("25.00")
    assert Decimal(item_a["total_cost_value"]) == Decimal("200.00")  # 20 * 10
    assert Decimal(item_a["total_retail_value"]) == Decimal("500.00")  # 20 * 25
    assert Decimal(item_a["potential_profit"]) == Decimal("300.00")  # 500 - 200
    assert item_a["stock_status"] == "IN_STOCK"

    # Verify Prod B item calculations
    item_b = all_rep_items[prod_b_id]
    assert item_b["current_stock"] == 6
    assert Decimal(item_b["cost_price"]) == Decimal("30.00")
    assert Decimal(item_b["unit_price"]) == Decimal("50.00")
    assert Decimal(item_b["total_cost_value"]) == Decimal("180.00")  # 6 * 30
    assert Decimal(item_b["total_retail_value"]) == Decimal("300.00")  # 6 * 50
    assert Decimal(item_b["potential_profit"]) == Decimal("120.00")  # 300 - 180
    assert item_b["stock_status"] == "LOW_STOCK"

    # Verify Prod C item calculations
    item_c = all_rep_items[prod_c_id]
    assert item_c["current_stock"] == 0
    assert Decimal(item_c["total_cost_value"]) == Decimal("0.00")
    assert Decimal(item_c["total_retail_value"]) == Decimal("0.00")
    assert Decimal(item_c["potential_profit"]) == Decimal("0.00")
    assert item_c["stock_status"] == "OUT_OF_STOCK"


def test_inventory_movements_report_accuracy(client: TestClient):
    """
    Test inventory movements summary by performing known stock-in and stock-out actions.
    """
    sku = unique_sku("MOV")
    prod_res = client.post("/api/v1/products", json={
        "name": "Movement Test Item",
        "sku": sku,
        "cost_price": "8.50",
        "unit_price": "19.99",
        "reorder_level": 5,
    })
    prod_id = prod_res.json()["id"]

    # Stock-in 50 units
    client.post("/api/v1/inventory/stock-in", json={
        "product_id": prod_id,
        "quantity": 50,
        "reason": "Batch delivery",
    })

    # Stock-in 25 units
    client.post("/api/v1/inventory/stock-in", json={
        "product_id": prod_id,
        "quantity": 25,
        "reason": "Supplemental delivery",
    })

    # Stock-out 15 units
    client.post("/api/v1/inventory/stock-out", json={
        "product_id": prod_id,
        "quantity": 15,
        "reason": "Customer order #1",
    })

    # Stock-out 10 units
    client.post("/api/v1/inventory/stock-out", json={
        "product_id": prod_id,
        "quantity": 10,
        "reason": "Customer order #2",
    })

    # Query movements specifically for this product
    today = date.today()
    res = client.get(
        f"/api/v1/reports/inventory-movements?product_id={prod_id}&start_date={today}&end_date={today}"
    )
    assert res.status_code == 200
    data = res.json()

    assert data["total_in_transactions"] == 2
    assert data["total_out_transactions"] == 2
    assert data["total_units_in"] == 75  # 50 + 25
    assert data["total_units_out"] == 25  # 15 + 10
    assert data["net_units_change"] == 50  # 75 - 25

    breakdowns = data["product_breakdowns"]
    assert len(breakdowns) == 1
    bd = breakdowns[0]
    assert bd["product_id"] == prod_id
    assert bd["units_in"] == 75
    assert bd["units_out"] == 25
    assert bd["net_movement"] == 50
    assert bd["transaction_count"] == 4


def test_inventory_movements_date_validation(client: TestClient):
    """
    Ensure date range validation prevents invalid start_date > end_date.
    """
    future_date = date.today() + timedelta(days=10)
    past_date = date.today() - timedelta(days=10)

    res = client.get(
        f"/api/v1/reports/inventory-movements?start_date={future_date}&end_date={past_date}"
    )
    assert res.status_code == 400
    assert "start_date" in res.json()["detail"]
    assert "cannot be later than end_date" in res.json()["detail"]


def test_cost_price_input_validation(client: TestClient):
    """
    Verify validation rules for cost_price:
    - cannot be negative (< 0)
    - defaults to 0.00 if omitted
    """
    # 1. Negative cost_price on create fails
    sku = unique_sku("NEG")
    res_neg = client.post("/api/v1/products", json={
        "name": "Negative Cost Item",
        "sku": sku,
        "cost_price": "-5.00",
        "unit_price": "10.00",
        "reorder_level": 5,
    })
    assert res_neg.status_code == 422

    # 2. Omitted cost_price defaults to 0.00
    sku_valid = unique_sku("DEF")
    res_def = client.post("/api/v1/products", json={
        "name": "Default Cost Item",
        "sku": sku_valid,
        "unit_price": "10.00",
        "reorder_level": 5,
    })
    assert res_def.status_code == 201
    assert Decimal(res_def.json()["cost_price"]) == Decimal("0.00")

    # 3. Negative cost_price on patch fails
    prod_id = res_def.json()["id"]
    res_patch_neg = client.patch(f"/api/v1/products/{prod_id}", json={
        "cost_price": "-1.50"
    })
    assert res_patch_neg.status_code == 422
