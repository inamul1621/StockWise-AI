from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import String, Text, Numeric, Integer, DateTime, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.inventory import InventoryTransaction

class Product(Base):
    """
    SQLAlchemy model representing a product in inventory.
    Stock quantities are tracked here for fast reads, but modifications
    are strictly controlled to prevent direct/untracked alterations.
    """
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    sku: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    current_stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    reorder_level: Mapped[int] = mapped_column(Integer, nullable=False, default=10, server_default="10")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    transactions: Mapped[List["InventoryTransaction"]] = relationship(
        "InventoryTransaction",
        back_populates="product",
        passive_deletes=True,
    )

    __table_args__ = (
        CheckConstraint("unit_price > 0", name="ck_products_unit_price_positive"),
        CheckConstraint("current_stock >= 0", name="ck_products_current_stock_non_negative"),
        CheckConstraint("reorder_level >= 0", name="ck_products_reorder_level_non_negative"),
    )

    def __repr__(self) -> str:
        return f"<Product id={self.id} sku='{self.sku}' name='{self.name}'>"
