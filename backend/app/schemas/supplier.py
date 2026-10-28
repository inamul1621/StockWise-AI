from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.product import ProductResponse

class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150, description="Supplier company or trade name")
    contact_person: Optional[str] = Field(None, max_length=100, description="Primary contact person")
    email: Optional[str] = Field(None, max_length=255, description="Supplier contact email")
    phone: Optional[str] = Field(None, max_length=50, description="Contact phone number")
    address: Optional[str] = Field(None, description="Physical / billing address")

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    contact_person: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None)

class SupplierSummary(BaseModel):
    id: int
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    product_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SupplierDetailResponse(SupplierSummary):
    products: List[ProductResponse] = []

class PaginatedSuppliersResponse(BaseModel):
    items: List[SupplierSummary]
    total: int
    page: int
    size: int
    pages: int
