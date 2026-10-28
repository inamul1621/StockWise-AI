import uuid
import pytest
from fastapi.testclient import TestClient

def unique_sku(prefix="SKU"):
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"

def test_create_product_success(client: TestClient):
    """
    Test creating a valid product.
    Should return 201 Created with initial stock set to 0.
    """
    sku = unique_sku("TEST")
    payload = {
        "name": "Wireless Ergonomic Mouse",
        "sku": sku,
        "category": "Electronics",
        "description": "High-precision optical mouse",
        "unit_price": "29.99",
        "reorder_level": 5,
    }

    response = client.post("/api/v1/products", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["name"] == "Wireless Ergonomic Mouse"
    assert data["sku"] == sku.upper()
    assert float(data["unit_price"]) == 29.99
    assert data["current_stock"] == 0
    assert data["reorder_level"] == 5

def test_create_product_duplicate_sku(client: TestClient):
    """
    Test that creating a product with an existing SKU returns 409 Conflict.
    """
    sku = unique_sku("DUP")
    payload = {
        "name": "Mechanical Keyboard",
        "sku": sku,
        "unit_price": "89.50",
        "reorder_level": 8,
    }

    # First creation must succeed
    res1 = client.post("/api/v1/products", json=payload)
    assert res1.status_code == 201

    # Second creation with identical SKU (even lower case) must fail with 409
    payload_duplicate = payload.copy()
    payload_duplicate["sku"] = sku.lower()
    res2 = client.post("/api/v1/products", json=payload_duplicate)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"]

def test_create_product_validation_failures(client: TestClient):
    """
    Test input validation constraints:
    - price must be > 0
    - reorder_level must be >= 0
    - sku and name cannot be blank
    """
    sku = unique_sku("VAL")

    # Invalid unit price (<= 0)
    res_price = client.post("/api/v1/products", json={
        "name": "Invalid Item",
        "sku": sku,
        "unit_price": "-5.00",
        "reorder_level": 5,
    })
    assert res_price.status_code == 422

    # Invalid reorder level (< 0)
    res_reorder = client.post("/api/v1/products", json={
        "name": "Invalid Item 2",
        "sku": sku,
        "unit_price": "10.00",
        "reorder_level": -2,
    })
    assert res_reorder.status_code == 422

    # Blank SKU
    res_blank_sku = client.post("/api/v1/products", json={
        "name": "Invalid Item 3",
        "sku": "   ",
        "unit_price": "10.00",
    })
    assert res_blank_sku.status_code == 422

def test_get_product_by_id_success(client: TestClient):
    """
    Test retrieving a specific product by its ID.
    """
    sku = unique_sku("GET")
    create_res = client.post("/api/v1/products", json={
        "name": "USB-C Charging Cable",
        "sku": sku,
        "category": "Accessories",
        "unit_price": "12.50",
    })
    assert create_res.status_code == 201
    product_id = create_res.json()["id"]

    get_res = client.get(f"/api/v1/products/{product_id}")
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["id"] == product_id
    assert data["sku"] == sku

def test_get_product_not_found(client: TestClient):
    """
    Test fetching a non-existent product ID returns 404.
    """
    res = client.get("/api/v1/products/999999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()

def test_list_products_search_and_pagination(client: TestClient):
    """
    Test listing products with query parameters:
    - Search by SKU or Name
    - Category filtering
    - Pagination (page and size)
    """
    unique_tag = uuid.uuid4().hex[:6]
    sku1 = f"ALPHA-{unique_tag}".upper()
    sku2 = f"BETA-{unique_tag}".upper()

    client.post("/api/v1/products", json={
        "name": f"Alpha Gadget {unique_tag}",
        "sku": sku1,
        "category": f"CatA_{unique_tag}",
        "unit_price": "19.99",
    })
    client.post("/api/v1/products", json={
        "name": f"Beta Widget {unique_tag}",
        "sku": sku2,
        "category": f"CatB_{unique_tag}",
        "unit_price": "39.99",
    })

    # Search by unique keyword
    search_res = client.get(f"/api/v1/products?search={unique_tag}")
    assert search_res.status_code == 200
    data = search_res.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2

    # Search specifically for Alpha
    alpha_res = client.get(f"/api/v1/products?search=Alpha Gadget {unique_tag}")
    assert alpha_res.status_code == 200
    assert alpha_res.json()["total"] == 1
    assert alpha_res.json()["items"][0]["sku"] == sku1

    # Filter by category
    cat_res = client.get(f"/api/v1/products?category=CatB_{unique_tag}")
    assert cat_res.status_code == 200
    assert cat_res.json()["total"] == 1
    assert cat_res.json()["items"][0]["sku"] == sku2

    # Pagination test: size=1, page=1
    page1 = client.get(f"/api/v1/products?search={unique_tag}&page=1&size=1")
    assert page1.status_code == 200
    assert len(page1.json()["items"]) == 1
    assert page1.json()["pages"] == 2

def test_update_product_success(client: TestClient):
    """
    Test partially updating product fields via PATCH.
    """
    sku = unique_sku("PATCH")
    created = client.post("/api/v1/products", json={
        "name": "Initial Name",
        "sku": sku,
        "unit_price": "20.00",
        "reorder_level": 5,
    }).json()

    patch_res = client.patch(f"/api/v1/products/{created['id']}", json={
        "name": "Updated Name",
        "unit_price": "25.50",
    })
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["name"] == "Updated Name"
    assert float(updated["unit_price"]) == 25.50
    assert updated["reorder_level"] == 5  # Unchanged

def test_update_product_stock_cannot_be_altered(client: TestClient):
    """
    Verify that current_stock is ignored if passed in the update payload.
    """
    sku = unique_sku("STOCK")
    created = client.post("/api/v1/products", json={
        "name": "Stock Test Item",
        "sku": sku,
        "unit_price": "15.00",
    }).json()

    # Attempt to inject current_stock via PATCH
    patch_res = client.patch(f"/api/v1/products/{created['id']}", json={
        "current_stock": 999,
        "name": "Updated Stock Test Item",
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["current_stock"] == 0  # Stock remains 0

def test_delete_product(client: TestClient):
    """
    Test deleting a product. Subsequent GET and DELETE calls must return 404.
    """
    sku = unique_sku("DEL")
    created = client.post("/api/v1/products", json={
        "name": "Disposable Item",
        "sku": sku,
        "unit_price": "5.00",
    }).json()
    product_id = created["id"]

    del_res = client.delete(f"/api/v1/products/{product_id}")
    assert del_res.status_code == 204

    # Subsequent GET returns 404
    get_res = client.get(f"/api/v1/products/{product_id}")
    assert get_res.status_code == 404

    # Subsequent DELETE returns 404
    del_res2 = client.delete(f"/api/v1/products/{product_id}")
    assert del_res2.status_code == 404
