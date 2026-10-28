import uuid
import pytest
from fastapi.testclient import TestClient

def unique_name(prefix="Supplier"):
    return f"{prefix} {uuid.uuid4().hex[:6].upper()}"

def test_create_supplier_success(client: TestClient):
    """
    Test creating a valid supplier.
    """
    name = unique_name("Acme Corp")
    payload = {
        "name": name,
        "contact_person": "Jane Doe",
        "email": "jane@acme.com",
        "phone": "+1-555-0199",
        "address": "123 Industrial Parkway, Suite 400",
    }
    response = client.post("/api/v1/suppliers", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["name"] == name
    assert data["contact_person"] == "Jane Doe"
    assert data["email"] == "jane@acme.com"
    assert data["product_count"] == 0

def test_get_supplier_by_id(client: TestClient):
    """
    Test retrieving a supplier by ID.
    """
    name = unique_name("Global Parts")
    create_res = client.post("/api/v1/suppliers", json={
        "name": name,
        "email": "contact@globalparts.com",
    }).json()
    supplier_id = create_res["id"]

    get_res = client.get(f"/api/v1/suppliers/{supplier_id}")
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["id"] == supplier_id
    assert data["name"] == name
    assert data["products"] == []

def test_get_nonexistent_supplier(client: TestClient):
    """
    Test fetching a non-existent supplier returns 404.
    """
    res = client.get("/api/v1/suppliers/999999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()

def test_list_suppliers_search_and_pagination(client: TestClient):
    """
    Test listing suppliers with search and pagination.
    """
    tag = uuid.uuid4().hex[:6].upper()
    s1_name = f"North Supplier {tag}"
    s2_name = f"South Supplier {tag}"

    client.post("/api/v1/suppliers", json={"name": s1_name, "email": f"north_{tag}@test.com"})
    client.post("/api/v1/suppliers", json={"name": s2_name, "email": f"south_{tag}@test.com"})

    # Search by unique tag
    search_res = client.get(f"/api/v1/suppliers?search={tag}")
    assert search_res.status_code == 200
    data = search_res.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2

    # Specific name search
    specific_res = client.get(f"/api/v1/suppliers?search=North Supplier {tag}")
    assert specific_res.status_code == 200
    assert specific_res.json()["total"] == 1
    assert specific_res.json()["items"][0]["name"] == s1_name

def test_update_supplier(client: TestClient):
    """
    Test partially updating supplier details via PATCH.
    """
    name = unique_name("Original Supplier")
    created = client.post("/api/v1/suppliers", json={
        "name": name,
        "contact_person": "Bob",
    }).json()

    patch_res = client.patch(f"/api/v1/suppliers/{created['id']}", json={
        "contact_person": "Robert Smith",
        "phone": "+1-800-555-1234",
    })
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["contact_person"] == "Robert Smith"
    assert data["phone"] == "+1-800-555-1234"
    assert data["name"] == name  # Unchanged

def test_link_product_to_supplier_and_filter(client: TestClient):
    """
    Test:
    1. Creating a product with supplier_id.
    2. Verifying supplier_name is returned in ProductResponse.
    3. Filtering products by supplier_id.
    4. Viewing supplier details shows the product in products list.
    """
    # Create supplier
    supplier_name = unique_name("Apex Electronics")
    supplier = client.post("/api/v1/suppliers", json={"name": supplier_name}).json()
    supplier_id = supplier["id"]

    # Create product linked to supplier
    sku = f"APEX-{uuid.uuid4().hex[:6].upper()}"
    prod = client.post("/api/v1/products", json={
        "name": "Apex Micro-Controller",
        "sku": sku,
        "unit_price": "14.50",
        "supplier_id": supplier_id,
    }).json()
    assert prod["supplier_id"] == supplier_id
    assert prod["supplier_name"] == supplier_name

    # Filter products by supplier_id
    filter_res = client.get(f"/api/v1/products?supplier_id={supplier_id}")
    assert filter_res.status_code == 200
    data = filter_res.json()
    assert data["total"] == 1
    assert data["items"][0]["sku"] == sku

    # Supplier detail shows product
    sup_detail = client.get(f"/api/v1/suppliers/{supplier_id}").json()
    assert sup_detail["product_count"] == 1
    assert len(sup_detail["products"]) == 1
    assert sup_detail["products"][0]["sku"] == sku

def test_invalid_supplier_reference_rejected(client: TestClient):
    """
    Test that creating or updating a product with a non-existent supplier_id fails with 400.
    """
    # Create with non-existent supplier
    res_create = client.post("/api/v1/products", json={
        "name": "Orphan Product",
        "sku": f"ORPH-{uuid.uuid4().hex[:6].upper()}",
        "unit_price": "9.99",
        "supplier_id": 999999,
    })
    assert res_create.status_code == 400
    assert "not found" in res_create.json()["detail"].lower()

    # Update with non-existent supplier
    prod = client.post("/api/v1/products", json={
        "name": "Valid Product",
        "sku": f"VAL-{uuid.uuid4().hex[:6].upper()}",
        "unit_price": "9.99",
    }).json()

    res_patch = client.patch(f"/api/v1/products/{prod['id']}", json={
        "supplier_id": 999999,
    })
    assert res_patch.status_code == 400
    assert "not found" in res_patch.json()["detail"].lower()

def test_delete_supplier_restrictions(client: TestClient):
    """
    Test deletion behavior:
    1. A supplier with linked products CANNOT be deleted (returns 400).
    2. An unlinked supplier can be deleted cleanly (returns 204).
    """
    supplier = client.post("/api/v1/suppliers", json={"name": unique_name("Protected Supplier")}).json()
    supplier_id = supplier["id"]

    # Link a product
    prod = client.post("/api/v1/products", json={
        "name": "Linked Item",
        "sku": f"LINK-{uuid.uuid4().hex[:6].upper()}",
        "unit_price": "5.00",
        "supplier_id": supplier_id,
    }).json()

    # Attempt to delete supplier -> must be rejected with 400
    del_res = client.delete(f"/api/v1/suppliers/{supplier_id}")
    assert del_res.status_code == 400
    assert "cannot delete" in del_res.json()["detail"].lower()

    # Unlink the product (or delete the product)
    client.delete(f"/api/v1/products/{prod['id']}")

    # Now deleting supplier must succeed
    del_success = client.delete(f"/api/v1/suppliers/{supplier_id}")
    assert del_success.status_code == 204

    # Subsequent GET returns 404
    get_res = client.get(f"/api/v1/suppliers/{supplier_id}")
    assert get_res.status_code == 404
