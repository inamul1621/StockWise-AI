from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    PaginatedProductsResponse,
)
from app.services.product_service import product_service

router = APIRouter(prefix="/products", tags=["Products"])

@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new product",
    description="Registers a new product with an initial stock count of 0. Stock changes are managed exclusively through inventory transactions.",
)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
) -> ProductResponse:
    return product_service.create_product(db=db, product_in=product_in)

@router.get(
    "",
    response_model=PaginatedProductsResponse,
    summary="List products with search & pagination",
    description="Returns a paginated list of products. Supports search by product name or SKU, as well as filtering by category.",
)
def list_products(
    search: Optional[str] = Query(None, description="Search term matching product name or SKU"),
    category: Optional[str] = Query(None, description="Filter by category"),
    page: int = Query(1, ge=1, description="Page number (starting at 1)"),
    size: int = Query(10, ge=1, le=100, description="Items per page (max 100)"),
    db: Session = Depends(get_db),
) -> PaginatedProductsResponse:
    items, total, pages = product_service.list_products(
        db=db,
        search=search,
        category=category,
        page=page,
        size=size,
    )
    return PaginatedProductsResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )

@router.get(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Get product by ID",
)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
) -> ProductResponse:
    return product_service.get_product_by_id(db=db, product_id=product_id)

@router.patch(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Update product details",
    description="Partially update product attributes (name, category, description, unit_price, reorder_level). Stock count cannot be edited here.",
)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
) -> ProductResponse:
    return product_service.update_product(
        db=db,
        product_id=product_id,
        product_in=product_in,
    )

@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a product",
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
) -> None:
    product_service.delete_product(db=db, product_id=product_id)
