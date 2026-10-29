import math
from datetime import date
from decimal import Decimal
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy import select, func, case
from sqlalchemy.orm import Session, joinedload

from app.models.product import Product
from app.models.supplier import Supplier
from app.models.inventory import InventoryTransaction
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    LowStockItemResponse,
    PaginatedLowStockResponse,
)
from app.schemas.reports import (
    InventoryReportItem,
    InventoryReportResponse,
    ProductMovementSummary,
    InventoryMovementsReportResponse,
)


class ReportService:
    """
    Business logic and analytics calculations for Dashboard and Inventory Reports.
    Pure database aggregations and deterministic Python computations (no ML/AI).
    """

    @staticmethod
    def get_dashboard_summary(db: Session) -> DashboardSummaryResponse:
        """
        Calculates high-level inventory KPIs.
        - total_products: count of active products
        - total_units_in_stock: total physical quantity of items on shelves
        - low_stock_products_count: products with current_stock <= reorder_level
        - out_of_stock_products_count: products with current_stock == 0
        - total_inventory_cost_value: valuation strictly computed as current_stock * cost_price
        - total_inventory_retail_value: valuation computed as current_stock * unit_price
        - potential_profit: total_inventory_retail_value - total_inventory_cost_value
        - total_suppliers: count of registered suppliers
        """
        # 1. Total products
        total_products = db.execute(select(func.count(Product.id))).scalar() or 0

        # 2. Total units in stock
        total_units = db.execute(select(func.coalesce(func.sum(Product.current_stock), 0))).scalar() or 0

        # 3. Low stock product count (current_stock <= reorder_level)
        low_stock_count = db.execute(
            select(func.count(Product.id)).where(Product.current_stock <= Product.reorder_level)
        ).scalar() or 0

        # 4. Out of stock product count (current_stock == 0)
        out_of_stock_count = db.execute(
            select(func.count(Product.id)).where(Product.current_stock == 0)
        ).scalar() or 0

        # 5. Inventory financial valuations
        val_query = select(
            func.coalesce(func.sum(Product.current_stock * Product.cost_price), Decimal("0.00")).label("cost_val"),
            func.coalesce(func.sum(Product.current_stock * Product.unit_price), Decimal("0.00")).label("retail_val"),
        )
        cost_val, retail_val = db.execute(val_query).one()
        cost_val = Decimal(str(cost_val or "0.00"))
        retail_val = Decimal(str(retail_val or "0.00"))
        potential_profit = retail_val - cost_val

        # 6. Total suppliers
        total_suppliers = db.execute(select(func.count(Supplier.id))).scalar() or 0

        return DashboardSummaryResponse(
            total_products=total_products,
            total_units_in_stock=total_units,
            low_stock_products_count=low_stock_count,
            out_of_stock_products_count=out_of_stock_count,
            total_inventory_cost_value=cost_val,
            total_inventory_retail_value=retail_val,
            potential_profit=potential_profit,
            total_suppliers=total_suppliers,
        )

    @staticmethod
    def get_low_stock_products(
        db: Session,
        page: int = 1,
        size: int = 20,
    ) -> PaginatedLowStockResponse:
        """
        Retrieves products requiring replenishment (current_stock <= reorder_level).
        Ordered by lowest current stock first, then product ID.
        """
        query = (
            select(Product)
            .options(joinedload(Product.supplier))
            .where(Product.current_stock <= Product.reorder_level)
        )

        count_query = select(func.count()).select_from(query.subquery())
        total = db.execute(count_query).scalar() or 0

        pages = math.ceil(total / size) if total > 0 else 1
        offset = (page - 1) * size

        products = db.execute(
            query.order_by(Product.current_stock.asc(), Product.id.asc())
            .offset(offset)
            .limit(size)
        ).scalars().all()

        items = [
            LowStockItemResponse(
                product_id=p.id,
                name=p.name,
                sku=p.sku,
                category=p.category,
                current_stock=p.current_stock,
                reorder_level=p.reorder_level,
                reorder_deficit=max(0, p.reorder_level - p.current_stock),
                cost_price=p.cost_price,
                unit_price=p.unit_price,
                supplier_id=p.supplier_id,
                supplier_name=p.supplier.name if p.supplier else None,
            )
            for p in products
        ]

        return PaginatedLowStockResponse(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=pages,
        )

    @staticmethod
    def get_inventory_report(
        db: Session,
        page: int = 1,
        size: int = 20,
        category: Optional[str] = None,
    ) -> InventoryReportResponse:
        """
        Generates full inventory valuation and stock health report.
        """
        query = select(Product).options(joinedload(Product.supplier))

        if category and category.strip():
            query = query.where(Product.category.ilike(category.strip()))

        # Overall totals across all matching products
        totals_query = select(
            func.count(Product.id).label("total_products"),
            func.coalesce(func.sum(Product.current_stock), 0).label("total_units"),
            func.coalesce(func.sum(Product.current_stock * Product.cost_price), Decimal("0.00")).label("cost_val"),
            func.coalesce(func.sum(Product.current_stock * Product.unit_price), Decimal("0.00")).label("retail_val"),
        )
        if category and category.strip():
            totals_query = totals_query.where(Product.category.ilike(category.strip()))

        total_prods, total_units, total_cost, total_retail = db.execute(totals_query).one()
        total_prods = total_prods or 0
        total_units = total_units or 0
        total_cost = Decimal(str(total_cost or "0.00"))
        total_retail = Decimal(str(total_retail or "0.00"))
        total_profit = total_retail - total_cost

        # Paginated items
        pages = math.ceil(total_prods / size) if total_prods > 0 else 1
        offset = (page - 1) * size

        products = db.execute(
            query.order_by(Product.name.asc(), Product.id.asc())
            .offset(offset)
            .limit(size)
        ).scalars().all()

        items = []
        for p in products:
            item_cost_val = Decimal(str(p.current_stock)) * p.cost_price
            item_retail_val = Decimal(str(p.current_stock)) * p.unit_price
            item_profit = item_retail_val - item_cost_val

            if p.current_stock == 0:
                stock_status = "OUT_OF_STOCK"
            elif p.current_stock <= p.reorder_level:
                stock_status = "LOW_STOCK"
            else:
                stock_status = "IN_STOCK"

            items.append(
                InventoryReportItem(
                    product_id=p.id,
                    name=p.name,
                    sku=p.sku,
                    category=p.category,
                    supplier_name=p.supplier.name if p.supplier else None,
                    current_stock=p.current_stock,
                    reorder_level=p.reorder_level,
                    cost_price=p.cost_price,
                    unit_price=p.unit_price,
                    total_cost_value=item_cost_val,
                    total_retail_value=item_retail_val,
                    potential_profit=item_profit,
                    stock_status=stock_status,
                )
            )

        return InventoryReportResponse(
            total_products=total_prods,
            total_units_in_stock=total_units,
            total_inventory_cost_value=total_cost,
            total_inventory_retail_value=total_retail,
            total_potential_profit=total_profit,
            items=items,
            total=total_prods,
            page=page,
            size=size,
            pages=pages,
        )

    @staticmethod
    def get_inventory_movements_report(
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        product_id: Optional[int] = None,
    ) -> InventoryMovementsReportResponse:
        """
        Summarizes stock movements across a date range and optionally by product.
        """
        if start_date and end_date and start_date > end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"start_date ({start_date}) cannot be later than end_date ({end_date}).",
            )

        # Base filter condition
        filters = []
        if start_date:
            filters.append(func.date(InventoryTransaction.created_at) >= start_date)
        if end_date:
            filters.append(func.date(InventoryTransaction.created_at) <= end_date)
        if product_id is not None:
            filters.append(InventoryTransaction.product_id == product_id)

        # 1. Overall Movement Aggregates
        in_tx_expr = case((InventoryTransaction.transaction_type == "IN", 1), else_=0)
        out_tx_expr = case((InventoryTransaction.transaction_type == "OUT", 1), else_=0)
        in_qty_expr = case((InventoryTransaction.transaction_type == "IN", InventoryTransaction.quantity), else_=0)
        out_qty_expr = case((InventoryTransaction.transaction_type == "OUT", InventoryTransaction.quantity), else_=0)

        summary_query = select(
            func.coalesce(func.sum(in_tx_expr), 0).label("in_tx"),
            func.coalesce(func.sum(out_tx_expr), 0).label("out_tx"),
            func.coalesce(func.sum(in_qty_expr), 0).label("in_qty"),
            func.coalesce(func.sum(out_qty_expr), 0).label("out_qty"),
        )
        if filters:
            summary_query = summary_query.where(*filters)

        in_tx, out_tx, in_qty, out_qty = db.execute(summary_query).one()
        in_tx = in_tx or 0
        out_tx = out_tx or 0
        in_qty = in_qty or 0
        out_qty = out_qty or 0
        net_change = in_qty - out_qty

        # 2. Product breakdown
        breakdown_query = (
            select(
                Product.id.label("product_id"),
                Product.name.label("product_name"),
                Product.sku.label("product_sku"),
                func.coalesce(func.sum(in_qty_expr), 0).label("units_in"),
                func.coalesce(func.sum(out_qty_expr), 0).label("units_out"),
                func.count(InventoryTransaction.id).label("tx_count"),
            )
            .join(InventoryTransaction, InventoryTransaction.product_id == Product.id)
        )
        if filters:
            breakdown_query = breakdown_query.where(*filters)

        breakdown_rows = (
            db.execute(
                breakdown_query.group_by(Product.id, Product.name, Product.sku).order_by(Product.name.asc())
            )
            .mappings()
            .all()
        )

        breakdowns = [
            ProductMovementSummary(
                product_id=row["product_id"],
                product_name=row["product_name"],
                product_sku=row["product_sku"],
                units_in=row["units_in"],
                units_out=row["units_out"],
                net_movement=row["units_in"] - row["units_out"],
                transaction_count=row["tx_count"],
            )
            for row in breakdown_rows
        ]

        return InventoryMovementsReportResponse(
            start_date=start_date,
            end_date=end_date,
            total_in_transactions=in_tx,
            total_out_transactions=out_tx,
            total_units_in=in_qty,
            total_units_out=out_qty,
            net_units_change=net_change,
            product_breakdowns=breakdowns,
        )


report_service = ReportService()
