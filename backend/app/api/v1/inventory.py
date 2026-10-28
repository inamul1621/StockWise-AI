from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.inventory import (
    StockInRequest,
    StockOutRequest,
    InventoryTransactionResponse,
    PaginatedTransactionsResponse,
)
from app.services.inventory_service import inventory_service

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.post(
    "/stock-in",
    response_model=InventoryTransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record stock addition (Stock In)",
    description="Increases physical stock balance and appends an immutable transaction record to the audit ledger.",
)
def stock_in(
    request: StockInRequest,
    db: Session = Depends(get_db),
) -> InventoryTransactionResponse:
    return inventory_service.record_stock_in(db=db, request=request)

@router.post(
    "/stock-out",
    response_model=InventoryTransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record stock reduction (Stock Out)",
    description="Decreases physical stock balance and appends an immutable transaction record. Rejects the operation if available stock is insufficient.",
)
def stock_out(
    request: StockOutRequest,
    db: Session = Depends(get_db),
) -> InventoryTransactionResponse:
    return inventory_service.record_stock_out(db=db, request=request)

@router.get(
    "/transactions",
    response_model=PaginatedTransactionsResponse,
    summary="List inventory transaction audit log",
    description="Retrieves paginated audit log of all stock movements. Filterable by product_id and transaction_type ('IN' or 'OUT').",
)
def list_transactions(
    product_id: Optional[int] = Query(None, description="Filter by product ID"),
    transaction_type: Optional[str] = Query(None, description="Filter by movement type ('IN' or 'OUT')"),
    page: int = Query(1, ge=1, description="Page number (starting at 1)"),
    size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    db: Session = Depends(get_db),
) -> PaginatedTransactionsResponse:
    items, total, pages = inventory_service.list_transactions(
        db=db,
        product_id=product_id,
        transaction_type=transaction_type,
        page=page,
        size=size,
    )
    return PaginatedTransactionsResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )

@router.get(
    "/transactions/{transaction_id}",
    response_model=InventoryTransactionResponse,
    summary="Get transaction by ID",
    description="Fetches a specific historical stock movement record from the audit ledger.",
)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
) -> InventoryTransactionResponse:
    return inventory_service.get_transaction_by_id(db=db, transaction_id=transaction_id)
