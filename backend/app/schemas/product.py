from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator

class ProductBase(BaseModel):
    """
    Base attributes shared across create and response schemas.
    """
    name: str = Field(..., min_length=1, max_length=200, description="Product title/name")
    sku: Optional[str] = None
    supplier_id: Optional[int] = Field(None, gt=0, description="Optional primary supplier ID")
    category: Optional[str] = Field(None, max_length=100, description="Product category for grouping")
    description: Optional[str] = Field(None, description="Detailed product description")
    cost_price: Decimal = Field(Decimal("0.00"), ge=0, decimal_places=2, description="Purchasing cost per unit (for inventory valuation)")
    unit_price: Decimal = Field(..., gt=0, decimal_places=2, description="Selling price per unit (must be > 0.00)")
    reorder_level: int = Field(10, ge=0, description="Threshold quantity that triggers a low-stock alert")

class ProductCreate(ProductBase):
    """
    Schema for creating a new product.
    Notice current_stock is deliberately omitted: stock can only be modified
    through inventory movements/transactions.
    """
    sku: str = Field(..., min_length=2, max_length=100, description="Unique Stock Keeping Unit (e.g. ELEC-001)")

    @field_validator("sku")
    @classmethod
    def validate_sku(cls, value: str) -> str:
        cleaned = value.strip().upper()
        if not cleaned:
            raise ValueError("SKU cannot be empty or only whitespace")
        return cleaned

class ProductUpdate(BaseModel):
    """
    Schema for updating product details via PATCH.
    All fields are optional. Stock quantity is strictly excluded.
    """
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    supplier_id: Optional[int] = Field(None, gt=0)
    category: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None)
    cost_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    unit_price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    reorder_level: Optional[int] = Field(None, ge=0)

class ProductResponse(BaseModel):
    """
    Schema returned to clients when viewing product details.
    """
    id: int
    name: str
    sku: str
    supplier_id: Optional[int] = None
    supplier_name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    cost_price: Decimal
    unit_price: Decimal
    current_stock: int
    reorder_level: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaginatedProductsResponse(BaseModel):
    """
    Standard paginated list structure.
    """
    items: List[ProductResponse]
    total: int
    page: int
    size: int
    pages: int
