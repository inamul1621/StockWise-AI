from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.reports import InventoryReportResponse, InventoryMovementsReportResponse
from app.services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get(
    "/inventory",
    response_model=InventoryReportResponse,
    status_code=status.HTTP_200_OK,
    summary="Get full inventory valuation report",
    description=(
        "Returns itemized stock valuation (cost value, retail value, potential profit) "
        "and overall valuation aggregates, optionally filtered by category."
    ),
)
def get_inventory_report(
    category: Optional[str] = Query(None, description="Optional category filter"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> InventoryReportResponse:
    return report_service.get_inventory_report(db, page=page, size=size, category=category)


@router.get(
    "/inventory-movements",
    response_model=InventoryMovementsReportResponse,
    status_code=status.HTTP_200_OK,
    summary="Get inventory movements report",
    description=(
        "Summarizes stock inflows and outflows across a date range (start_date to end_date) "
        "and provides net unit changes per product."
    ),
)
def get_inventory_movements(
    start_date: Optional[date] = Query(None, description="Start date (YYYY-MM-DD), inclusive"),
    end_date: Optional[date] = Query(None, description="End date (YYYY-MM-DD), inclusive"),
    product_id: Optional[int] = Query(None, description="Optional product ID filter"),
    db: Session = Depends(get_db),
) -> InventoryMovementsReportResponse:
    return report_service.get_inventory_movements_report(
        db,
        start_date=start_date,
        end_date=end_date,
        product_id=product_id,
    )
