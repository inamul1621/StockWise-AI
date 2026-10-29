import math
from typing import Optional, Tuple, List
from fastapi import HTTPException, status
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session, selectinload

from app.models.supplier import Supplier
from app.models.product import Product
from app.schemas.supplier import (
    SupplierCreate,
    SupplierUpdate,
    SupplierSummary,
    SupplierDetailResponse,
)
from app.schemas.product import ProductResponse

class SupplierService:
    """
    Business logic and operations for Supplier management.
    """

    @staticmethod
    def create_supplier(db: Session, supplier_in: SupplierCreate) -> SupplierSummary:
        """
        Creates a new supplier.
        """
        supplier = Supplier(
            name=supplier_in.name.strip(),
            contact_person=supplier_in.contact_person.strip() if supplier_in.contact_person else None,
            email=supplier_in.email.strip() if supplier_in.email else None,
            phone=supplier_in.phone.strip() if supplier_in.phone else None,
            address=supplier_in.address.strip() if supplier_in.address else None,
        )
        db.add(supplier)
        db.commit()
        db.refresh(supplier)

        return SupplierSummary(
            id=supplier.id,
            name=supplier.name,
            contact_person=supplier.contact_person,
            email=supplier.email,
            phone=supplier.phone,
            address=supplier.address,
            product_count=0,
            created_at=supplier.created_at,
            updated_at=supplier.updated_at,
        )

    @staticmethod
    def get_supplier_by_id(db: Session, supplier_id: int) -> SupplierDetailResponse:
        """
        Retrieves a single supplier by ID including associated products.
        """
        supplier = db.execute(
            select(Supplier)
            .options(selectinload(Supplier.products))
            .where(Supplier.id == supplier_id)
        ).scalar_one_or_none()

        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Supplier with ID {supplier_id} not found.",
            )

        products_list = [
            ProductResponse(
                id=p.id,
                name=p.name,
                sku=p.sku,
                supplier_id=p.supplier_id,
                supplier_name=supplier.name,
                category=p.category,
                description=p.description,
                unit_price=p.unit_price,
                cost_price=p.cost_price,
                current_stock=p.current_stock,
                reorder_level=p.reorder_level,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
            for p in supplier.products
        ]

        return SupplierDetailResponse(
            id=supplier.id,
            name=supplier.name,
            contact_person=supplier.contact_person,
            email=supplier.email,
            phone=supplier.phone,
            address=supplier.address,
            product_count=len(products_list),
            products=products_list,
            created_at=supplier.created_at,
            updated_at=supplier.updated_at,
        )

    @staticmethod
    def list_suppliers(
        db: Session,
        search: Optional[str] = None,
        page: int = 1,
        size: int = 10,
    ) -> Tuple[List[SupplierSummary], int, int]:
        """
        Lists suppliers with search and pagination, calculating product_count.
        """
        # Base query joining with product counts
        subq = (
            select(Product.supplier_id, func.count(Product.id).label("prod_count"))
            .group_by(Product.supplier_id)
            .subquery()
        )

        query = select(
            Supplier,
            func.coalesce(subq.c.prod_count, 0).label("product_count"),
        ).outerjoin(subq, Supplier.id == subq.c.supplier_id)

        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Supplier.name.ilike(term),
                    Supplier.contact_person.ilike(term),
                    Supplier.email.ilike(term),
                )
            )

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = db.execute(count_query).scalar() or 0

        pages = math.ceil(total / size) if total > 0 else 1
        offset = (page - 1) * size

        results = db.execute(
            query.order_by(Supplier.id.asc()).offset(offset).limit(size)
        ).all()

        items = [
            SupplierSummary(
                id=s.id,
                name=s.name,
                contact_person=s.contact_person,
                email=s.email,
                phone=s.phone,
                address=s.address,
                product_count=count,
                created_at=s.created_at,
                updated_at=s.updated_at,
            )
            for s, count in results
        ]

        return items, total, pages

    @staticmethod
    def update_supplier(
        db: Session,
        supplier_id: int,
        supplier_in: SupplierUpdate,
    ) -> SupplierSummary:
        """
        Updates an existing supplier's details.
        """
        supplier = db.get(Supplier, supplier_id)
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Supplier with ID {supplier_id} not found.",
            )

        update_data = supplier_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if isinstance(value, str):
                value = value.strip()
            setattr(supplier, field, value)

        db.commit()
        db.refresh(supplier)

        count = db.execute(
            select(func.count(Product.id)).where(Product.supplier_id == supplier.id)
        ).scalar() or 0

        return SupplierSummary(
            id=supplier.id,
            name=supplier.name,
            contact_person=supplier.contact_person,
            email=supplier.email,
            phone=supplier.phone,
            address=supplier.address,
            product_count=count,
            created_at=supplier.created_at,
            updated_at=supplier.updated_at,
        )

    @staticmethod
    def delete_supplier(db: Session, supplier_id: int) -> None:
        """
        Deletes a supplier if no products are linked to it.
        Enforces deletion restrictions to protect data integrity.
        """
        supplier = db.get(Supplier, supplier_id)
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Supplier with ID {supplier_id} not found.",
            )

        linked_count = db.execute(
            select(func.count(Product.id)).where(Product.supplier_id == supplier_id)
        ).scalar() or 0

        if linked_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Cannot delete supplier '{supplier.name}' because it is linked to {linked_count} "
                    f"product(s). Please reassign or unlink these products before deleting this supplier."
                ),
            )

        db.delete(supplier)
        db.commit()

supplier_service = SupplierService()
