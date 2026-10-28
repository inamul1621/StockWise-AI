from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ConfigDict

class StockMovementBase(BaseModel):
    product_id: int = Field(..., gt=0, description="Product ID to update stock for")
    quantity: int = Field(..., gt=0, description="Number of units (must be greater than 0)")
    reference: Optional[str] = Field(None, max_length=100, description="External reference (e.g. PO-1029, INV-882)")
    reason: Optional[str] = Field(None, max_length=255, description="Brief explanation for the stock movement")
    notes: Optional[str] = Field(None, description="Detailed notes or remarks")

class StockInRequest(StockMovementBase):
    """
    Payload for recording stock received / added to inventory.
    """
    pass

class StockOutRequest(StockMovementBase):
    """
    Payload for recording stock removed from inventory (e.g. sales, write-offs).
    """
    pass

class InventoryTransactionResponse(BaseModel):
    """
    Full details of a recorded inventory transaction.
    """
    id: int
    product_id: int
    product_name: str
    product_sku: str
    transaction_type: Literal["IN", "OUT"]
    quantity: int
    reference: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    current_stock_after: int

    model_config = ConfigDict(from_attributes=True)

class PaginatedTransactionsResponse(BaseModel):
    """
    Paginated inventory transaction audit log.
    """
    items: List[InventoryTransactionResponse]
    total: int
    page: int
    size: int
    pages: int
