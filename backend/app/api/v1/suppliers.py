from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.supplier import (
    SupplierCreate,
    SupplierUpdate,
    SupplierSummary,
    SupplierDetailResponse,
    PaginatedSuppliersResponse,
)
from app.services.supplier_service import supplier_service

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

@router.post(
    "",
    response_model=SupplierSummary,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new supplier",
)
def create_supplier(
    supplier_in: SupplierCreate,
    db: Session = Depends(get_db),
) -> SupplierSummary:
    return supplier_service.create_supplier(db=db, supplier_in=supplier_in)

@router.get(
    "",
    response_model=PaginatedSuppliersResponse,
    summary="List suppliers with search & pagination",
    description="Lists suppliers with calculated product counts. Searchable by name, contact person, or email.",
)
def list_suppliers(
    search: Optional[str] = Query(None, description="Search term for name, contact person, or email"),
    page: int = Query(1, ge=1, description="Page number (starting at 1)"),
    size: int = Query(10, ge=1, le=100, description="Items per page (max 100)"),
    db: Session = Depends(get_db),
) -> PaginatedSuppliersResponse:
    items, total, pages = supplier_service.list_suppliers(
        db=db,
        search=search,
        page=page,
        size=size,
    )
    return PaginatedSuppliersResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )

@router.get(
    "/{supplier_id}",
    response_model=SupplierDetailResponse,
    summary="Get supplier details and linked products",
)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
) -> SupplierDetailResponse:
    return supplier_service.get_supplier_by_id(db=db, supplier_id=supplier_id)

@router.patch(
    "/{supplier_id}",
    response_model=SupplierSummary,
    summary="Update supplier information",
)
def update_supplier(
    supplier_id: int,
    supplier_in: SupplierUpdate,
    db: Session = Depends(get_db),
) -> SupplierSummary:
    return supplier_service.update_supplier(
        db=db,
        supplier_id=supplier_id,
        supplier_in=supplier_in,
    )

@router.delete(
    "/{supplier_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a supplier",
    description="Deletes a supplier. Fails with 400 Bad Request if products are still assigned to this supplier.",
)
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
) -> None:
    supplier_service.delete_supplier(db=db, supplier_id=supplier_id)
