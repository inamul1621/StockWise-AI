import math
from typing import Optional, Tuple, List
from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from app.models.product import Product
from app.models.inventory import InventoryTransaction
from app.schemas.inventory import (
    StockInRequest,
    StockOutRequest,
    InventoryTransactionResponse,
)

class InventoryService:
    """
    Manages stock balance changes and maintains an append-only audit ledger.
    Enforces atomic database transactions, pessimistic row-level locking,
    and non-negative stock guarantees.
    """

    @staticmethod
    def record_stock_in(
        db: Session,
        request: StockInRequest,
    ) -> InventoryTransactionResponse:
        """
        Records a stock addition (Stock In).
        Acquires an exclusive row lock on the product, increments current_stock,
        and logs the transaction in the exact same database transaction.
        """
        # 1. Fetch product with row-level lock (FOR UPDATE)
        product = db.execute(
            select(Product)
            .where(Product.id == request.product_id)
            .with_for_update()
        ).scalar_one_or_none()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {request.product_id} not found.",
            )

        # 2. Increment stock atomically
        product.current_stock += request.quantity

        # 3. Create immutable audit transaction record
        tx = InventoryTransaction(
            product_id=product.id,
            transaction_type="IN",
            quantity=request.quantity,
            reference=request.reference.strip() if request.reference else None,
            reason=request.reason.strip() if request.reason else None,
            notes=request.notes.strip() if request.notes else None,
        )
        db.add(tx)

        # 4. Commit atomic transaction
        db.commit()
        db.refresh(tx)

        return InventoryTransactionResponse(
            id=tx.id,
            product_id=product.id,
            product_name=product.name,
            product_sku=product.sku,
            transaction_type="IN",
            quantity=tx.quantity,
            reference=tx.reference,
            reason=tx.reason,
            notes=tx.notes,
            created_at=tx.created_at,
            current_stock_after=product.current_stock,
        )

    @staticmethod
    def record_stock_out(
        db: Session,
        request: StockOutRequest,
    ) -> InventoryTransactionResponse:
        """
        Records a stock reduction (Stock Out).
        Locks the product row, ensures available stock is sufficient to prevent negative balance,
        decrements current_stock, and logs the transaction.
        """
        # 1. Fetch product with row-level lock (FOR UPDATE)
        product = db.execute(
            select(Product)
            .where(Product.id == request.product_id)
            .with_for_update()
        ).scalar_one_or_none()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {request.product_id} not found.",
            )

        # 2. Enforce non-negative stock constraint
        if product.current_stock < request.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). "
                    f"Available stock: {product.current_stock}, requested reduction: {request.quantity}."
                ),
            )

        # 3. Decrement stock atomically
        product.current_stock -= request.quantity

        # 4. Create immutable audit transaction record
        tx = InventoryTransaction(
            product_id=product.id,
            transaction_type="OUT",
            quantity=request.quantity,
            reference=request.reference.strip() if request.reference else None,
            reason=request.reason.strip() if request.reason else None,
            notes=request.notes.strip() if request.notes else None,
        )
        db.add(tx)

        # 5. Commit atomic transaction
        db.commit()
        db.refresh(tx)

        return InventoryTransactionResponse(
            id=tx.id,
            product_id=product.id,
            product_name=product.name,
            product_sku=product.sku,
            transaction_type="OUT",
            quantity=tx.quantity,
            reference=tx.reference,
            reason=tx.reason,
            notes=tx.notes,
            created_at=tx.created_at,
            current_stock_after=product.current_stock,
        )

    @staticmethod
    def list_transactions(
        db: Session,
        product_id: Optional[int] = None,
        transaction_type: Optional[str] = None,
        page: int = 1,
        size: int = 20,
    ) -> Tuple[List[InventoryTransactionResponse], int, int]:
        """
        Lists transaction audit logs with optional filters and pagination.
        Ordered by created_at desc (newest first).
        """
        query = select(InventoryTransaction).options(joinedload(InventoryTransaction.product))

        if product_id is not None:
            query = query.where(InventoryTransaction.product_id == product_id)

        if transaction_type is not None:
            tx_type = transaction_type.strip().upper()
            if tx_type in ("IN", "OUT"):
                query = query.where(InventoryTransaction.transaction_type == tx_type)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = db.execute(count_query).scalar() or 0

        pages = math.ceil(total / size) if total > 0 else 1
        offset = (page - 1) * size

        records = db.execute(
            query.order_by(InventoryTransaction.id.desc())
            .offset(offset)
            .limit(size)
        ).scalars().all()

        items = [
            InventoryTransactionResponse(
                id=tx.id,
                product_id=tx.product_id,
                product_name=tx.product.name if tx.product else "Unknown",
                product_sku=tx.product.sku if tx.product else "Unknown",
                transaction_type=tx.transaction_type,  # type: ignore
                quantity=tx.quantity,
                reference=tx.reference,
                reason=tx.reason,
                notes=tx.notes,
                created_at=tx.created_at,
                current_stock_after=tx.product.current_stock if tx.product else 0,
            )
            for tx in records
        ]

        return items, total, pages

    @staticmethod
    def get_transaction_by_id(
        db: Session,
        transaction_id: int,
    ) -> InventoryTransactionResponse:
        """
        Retrieves a single transaction by ID or raises 404 NOT FOUND.
        """
        tx = db.execute(
            select(InventoryTransaction)
            .options(joinedload(InventoryTransaction.product))
            .where(InventoryTransaction.id == transaction_id)
        ).scalar_one_or_none()

        if not tx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inventory transaction with ID {transaction_id} not found.",
            )

        return InventoryTransactionResponse(
            id=tx.id,
            product_id=tx.product_id,
            product_name=tx.product.name if tx.product else "Unknown",
            product_sku=tx.product.sku if tx.product else "Unknown",
            transaction_type=tx.transaction_type,  # type: ignore
            quantity=tx.quantity,
            reference=tx.reference,
            reason=tx.reason,
            notes=tx.notes,
            created_at=tx.created_at,
            current_stock_after=tx.product.current_stock if tx.product else 0,
        )

inventory_service = InventoryService()
