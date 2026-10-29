from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class DashboardSummaryResponse(BaseModel):
    """
    High-level dashboard metrics for the inventory system.
    """
    total_products: int = Field(..., description="Total number of distinct products registered in the catalog.")
    total_units_in_stock: int = Field(..., description="Total quantity of physical units across all products.")
    low_stock_products_count: int = Field(
        ...,
        description="Number of products whose current stock is at or below their reorder level.",
    )
    out_of_stock_products_count: int = Field(
        ...,
        description="Number of products with zero units in stock.",
    )
    total_inventory_cost_value: Decimal = Field(
        ...,
        description="Total valuation of on-hand inventory computed as sum(current_stock * cost_price).",
    )
    total_inventory_retail_value: Decimal = Field(
        ...,
        description="Total potential retail sales value computed as sum(current_stock * unit_price).",
    )
    potential_profit: Decimal = Field(
        ...,
        description="Potential gross profit computed as total retail value minus total cost value.",
    )
    total_suppliers: int = Field(..., description="Total number of suppliers registered in the system.")

    model_config = ConfigDict(from_attributes=True)


class LowStockItemResponse(BaseModel):
    """
    Detailed information for a single product that requires reordering.
    """
    product_id: int
    name: str
    sku: str
    category: Optional[str] = None
    current_stock: int
    reorder_level: int
    reorder_deficit: int = Field(
        ...,
        description="Units needed to reach reorder level, computed as max(0, reorder_level - current_stock).",
    )
    cost_price: Decimal
    unit_price: Decimal
    supplier_id: Optional[int] = None
    supplier_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedLowStockResponse(BaseModel):
    """
    Paginated list of low-stock alert items.
    """
    items: List[LowStockItemResponse]
    total: int
    page: int
    size: int
    pages: int
