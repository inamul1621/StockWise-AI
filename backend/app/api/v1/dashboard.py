from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.dashboard import DashboardSummaryResponse, PaginatedLowStockResponse
from app.services.report_service import report_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get overall dashboard statistics",
    description=(
        "Returns high-level inventory metrics: total products, total stock units, "
        "low-stock count, out-of-stock count, total cost valuation, retail valuation, "
        "and potential profit."
    ),
)
def get_dashboard_summary(db: Session = Depends(get_db)) -> DashboardSummaryResponse:
    return report_service.get_dashboard_summary(db)


@router.get(
    "/low-stock",
    response_model=PaginatedLowStockResponse,
    status_code=status.HTTP_200_OK,
    summary="Get low-stock alert products",
    description=(
        "Retrieves all products whose current stock is at or below their configured "
        "reorder level, ordered by lowest current stock first."
    ),
)
def get_low_stock_products(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> PaginatedLowStockResponse:
    return report_service.get_low_stock_products(db, page=page, size=size)
