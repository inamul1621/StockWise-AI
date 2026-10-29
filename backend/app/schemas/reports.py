from datetime import date
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class InventoryReportItem(BaseModel):
    """
    Detailed inventory status and financial valuation for an individual product.
    """
    product_id: int
    name: str
    sku: str
    category: Optional[str] = None
    supplier_name: Optional[str] = None
    current_stock: int
    reorder_level: int
    cost_price: Decimal = Field(..., description="Cost/acquisition price per unit.")
    unit_price: Decimal = Field(..., description="Retail/selling price per unit.")
    total_cost_value: Decimal = Field(..., description="current_stock * cost_price")
    total_retail_value: Decimal = Field(..., description="current_stock * unit_price")
    potential_profit: Decimal = Field(..., description="total_retail_value - total_cost_value")
    stock_status: str = Field(..., description="'OUT_OF_STOCK', 'LOW_STOCK', or 'IN_STOCK'")

    model_config = ConfigDict(from_attributes=True)


class InventoryReportResponse(BaseModel):
    """
    Comprehensive inventory valuation report with paginated product breakdowns.
    """
    total_products: int
    total_units_in_stock: int
    total_inventory_cost_value: Decimal = Field(
        ...,
        description="Total valuation at cost price across all matching products.",
    )
    total_inventory_retail_value: Decimal = Field(
        ...,
        description="Total valuation at retail selling price across all matching products.",
    )
    total_potential_profit: Decimal = Field(
        ...,
        description="Potential gross profit across all matching products.",
    )
    items: List[InventoryReportItem]
    total: int
    page: int
    size: int
    pages: int


class ProductMovementSummary(BaseModel):
    """
    Summary of stock-in and stock-out movements for a specific product.
    """
    product_id: int
    product_name: str
    product_sku: str
    units_in: int = Field(..., description="Total units added via STOCK_IN.")
    units_out: int = Field(..., description="Total units subtracted via STOCK_OUT.")
    net_movement: int = Field(..., description="Net change in stock units: units_in - units_out.")
    transaction_count: int = Field(..., description="Total number of transaction records for this product.")

    model_config = ConfigDict(from_attributes=True)


class InventoryMovementsReportResponse(BaseModel):
    """
    Report aggregating inventory movements within a specified date range.
    """
    start_date: Optional[date] = Field(None, description="Start date of the reporting window (inclusive).")
    end_date: Optional[date] = Field(None, description="End date of the reporting window (inclusive).")
    total_in_transactions: int = Field(..., description="Number of STOCK_IN transaction records.")
    total_out_transactions: int = Field(..., description="Number of STOCK_OUT transaction records.")
    total_units_in: int = Field(..., description="Sum of all units received into inventory.")
    total_units_out: int = Field(..., description="Sum of all units deducted from inventory.")
    net_units_change: int = Field(..., description="Overall net change: total_units_in - total_units_out.")
    product_breakdowns: List[ProductMovementSummary]
