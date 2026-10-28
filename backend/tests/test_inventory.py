import uuid
import pytest
from fastapi.testclient import TestClient

def create_test_product(client: TestClient, name="Inventory Test Product", price="19.99"):
    sku = f"INV-{uuid.uuid4().hex[:8].upper()}"
    res = client.post("/api/v1/products", json={
        "name": name,
        "sku": sku,
        "unit_price": price,
        "reorder_level": 5,
    })
    assert res.status_code == 201
    return res.json()

def test_stock_in_success(client: TestClient):
    """
    Test recording a stock addition (Stock In).
    Verifies that product stock increases and a transaction record is created.
    """
    product = create_test_product(client)
    product_id = product["id"]
    assert product["current_stock"] == 0

    res = client.post("/api/v1/inventory/stock-in", json={
        "product_id": product_id,
        "quantity": 25,
        "reference": "PO-1001",
        "reason": "Initial warehouse stock",
        "notes": "Delivered by Supplier A",
    })
    assert res.status_code == 201
    data = res.json()
    assert data["product_id"] == product_id
    assert data["transaction_type"] == "IN"
    assert data["quantity"] == 25
    assert data["reference"] == "PO-1001"
    assert data["current_stock_after"] == 25

    # Verify that fetching the product shows updated current_stock
    prod_res = client.get(f"/api/v1/products/{product_id}")
    assert prod_res.status_code == 200
    assert prod_res.json()["current_stock"] == 25

def test_stock_out_success(client: TestClient):
    """
    Test recording a stock reduction (Stock Out).
    """
    product = create_test_product(client)
    product_id = product["id"]

    # Stock in 40 units first
    client.post("/api/v1/inventory/stock-in", json={
        "product_id": product_id,
        "quantity": 40,
        "reference": "PO-INIT",
    })

    # Stock out 15 units
    out_res = client.post("/api/v1/inventory/stock-out", json={
        "product_id": product_id,
        "quantity": 15,
        "reference": "ORDER-991",
        "reason": "Customer sale",
    })
    assert out_res.status_code == 201
    data = out_res.json()
    assert data["transaction_type"] == "OUT"
    assert data["quantity"] == 15
    assert data["current_stock_after"] == 25

    # Verify product stock is 25
    prod_res = client.get(f"/api/v1/products/{product_id}")
    assert prod_res.json()["current_stock"] == 25

def test_stock_out_insufficient_stock_fails(client: TestClient):
    """
    Test that reducing stock beyond available stock returns 400 Bad Request
    and does NOT modify balance or create a transaction.
    """
    product = create_test_product(client)
    product_id = product["id"]

    # Stock in 10 units
    client.post("/api/v1/inventory/stock-in", json={
        "product_id": product_id,
        "quantity": 10,
    })

    # Attempt to stock out 15 units (available: 10)
    out_res = client.post("/api/v1/inventory/stock-out", json={
        "product_id": product_id,
        "quantity": 15,
        "reference": "OVERSELL-ATTEMPT",
    })
    assert out_res.status_code == 400
    assert "insufficient stock" in out_res.json()["detail"].lower()

    # Verify stock remained at 10
    prod_res = client.get(f"/api/v1/products/{product_id}")
    assert prod_res.json()["current_stock"] == 10

    # Verify only 1 transaction exists (the stock-in), none for the failed stock-out
    tx_res = client.get(f"/api/v1/inventory/transactions?product_id={product_id}")
    assert tx_res.status_code == 200
    assert tx_res.json()["total"] == 1
    assert tx_res.json()["items"][0]["transaction_type"] == "IN"

def test_invalid_quantity_validation(client: TestClient):
    """
    Test that non-positive quantities (0 or negative) are rejected by schema validation.
    """
    product = create_test_product(client)
    product_id = product["id"]

    # Quantity 0
    res_zero = client.post("/api/v1/inventory/stock-in", json={
        "product_id": product_id,
        "quantity": 0,
    })
    assert res_zero.status_code == 422

    # Negative quantity
    res_neg = client.post("/api/v1/inventory/stock-out", json={
        "product_id": product_id,
        "quantity": -5,
    })
    assert res_neg.status_code == 422

def test_nonexistent_product_reference(client: TestClient):
    """
    Test that operations targeting a non-existent product return 404 Not Found.
    """
    res_in = client.post("/api/v1/inventory/stock-in", json={
        "product_id": 999999,
        "quantity": 10,
    })
    assert res_in.status_code == 404

    res_out = client.post("/api/v1/inventory/stock-out", json={
        "product_id": 999999,
        "quantity": 10,
    })
    assert res_out.status_code == 404

def test_ledger_balance_consistency(client: TestClient):
    """
    Perform a series of stock movements and verify that:
    current_stock == sum(all 'IN' quantities) - sum(all 'OUT' quantities)
    """
    product = create_test_product(client)
    product_id = product["id"]

    movements = [
        ("stock-in", 100),
        ("stock-in", 50),
        ("stock-out", 30),
        ("stock-out", 45),
        ("stock-in", 20),
        ("stock-out", 15),
    ]

    expected_balance = 0
    for endpoint, qty in movements:
        res = client.post(f"/api/v1/inventory/{endpoint}", json={
            "product_id": product_id,
            "quantity": qty,
        })
        assert res.status_code == 201
        if endpoint == "stock-in":
            expected_balance += qty
        else:
            expected_balance -= qty

    # Check product stock
    prod = client.get(f"/api/v1/products/{product_id}").json()
    assert prod["current_stock"] == expected_balance
    assert expected_balance == (100 + 50 - 30 - 45 + 20 - 15)  # 80 units

    # Check transaction ledger
    tx_list = client.get(f"/api/v1/inventory/transactions?product_id={product_id}&size=50").json()
    assert tx_list["total"] == len(movements)

    calc_balance = 0
    for tx in tx_list["items"]:
        if tx["transaction_type"] == "IN":
            calc_balance += tx["quantity"]
        elif tx["transaction_type"] == "OUT":
            calc_balance -= tx["quantity"]

    assert calc_balance == prod["current_stock"]

def test_get_transaction_by_id(client: TestClient):
    """
    Test retrieving a specific transaction by ID.
    """
    product = create_test_product(client)
    in_res = client.post("/api/v1/inventory/stock-in", json={
        "product_id": product["id"],
        "quantity": 12,
        "reference": "REF-ABC-123",
    }).json()
    tx_id = in_res["id"]

    get_tx = client.get(f"/api/v1/inventory/transactions/{tx_id}")
    assert get_tx.status_code == 200
    data = get_tx.json()
    assert data["id"] == tx_id
    assert data["reference"] == "REF-ABC-123"
    assert data["quantity"] == 12

    # Non-existent transaction ID
    not_found = client.get("/api/v1/inventory/transactions/999999")
    assert not_found.status_code == 404
