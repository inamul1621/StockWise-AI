from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.product import Product

class InventoryTransaction(Base):
    """
    Immutable audit ledger recording all physical stock movements.
    Stock additions ('IN') and stock reductions ('OUT').
    """
    __tablename__ = "inventory_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    transaction_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    # Relationship to Product
    product: Mapped["Product"] = relationship("Product", back_populates="transactions")

    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_inv_trans_quantity_positive"),
        CheckConstraint("transaction_type IN ('IN', 'OUT')", name="ck_inv_trans_type_valid"),
    )

    def __repr__(self) -> str:
        return f"<InventoryTransaction id={self.id} product_id={self.product_id} type='{self.transaction_type}' qty={self.quantity}>"
