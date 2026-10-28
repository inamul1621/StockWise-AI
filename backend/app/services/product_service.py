import math
from typing import Optional, Tuple, List
from fastapi import HTTPException, status
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session, joinedload

from app.models.product import Product
from app.models.supplier import Supplier
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse

class ProductService:
    """
    Business logic and database persistence for Products.
    Decoupled from FastAPI request/response routing.
    """

    @staticmethod
    def _to_response(product: Product) -> ProductResponse:
        return ProductResponse(
            id=product.id,
            name=product.name,
            sku=product.sku,
            supplier_id=product.supplier_id,
            supplier_name=product.supplier.name if product.supplier else None,
            category=product.category,
            description=product.description,
            unit_price=product.unit_price,
            current_stock=product.current_stock,
            reorder_level=product.reorder_level,
            created_at=product.created_at,
            updated_at=product.updated_at,
        )

    @staticmethod
    def create_product(db: Session, product_in: ProductCreate) -> ProductResponse:
        """
        Creates a new product after verifying SKU uniqueness and supplier existence.
        """
        # Validate supplier if provided
        if product_in.supplier_id is not None:
            supplier = db.get(Supplier, product_in.supplier_id)
            if not supplier:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Supplier with ID {product_in.supplier_id} not found.",
                )

        # Enforce case-insensitive SKU uniqueness
        existing = db.execute(
            select(Product).where(func.upper(Product.sku) == product_in.sku.upper())
        ).scalar_one_or_none()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product with SKU '{product_in.sku}' already exists.",
            )

        new_product = Product(
            name=product_in.name.strip(),
            sku=product_in.sku.strip().upper(),
            supplier_id=product_in.supplier_id,
            category=product_in.category.strip() if product_in.category else None,
            description=product_in.description.strip() if product_in.description else None,
            unit_price=product_in.unit_price,
            reorder_level=product_in.reorder_level,
            current_stock=0,  # Always initialized to 0; only inventory movements change stock
        )

        db.add(new_product)
        db.commit()
        db.refresh(new_product)

        # Reload with supplier relationship
        db.refresh(new_product, ["supplier"])
        return ProductService._to_response(new_product)

    @staticmethod
    def get_product_by_id(db: Session, product_id: int) -> ProductResponse:
        """
        Retrieves a single product by its ID or raises 404 NOT FOUND.
        """
        product = db.execute(
            select(Product)
            .options(joinedload(Product.supplier))
            .where(Product.id == product_id)
        ).scalar_one_or_none()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {product_id} not found.",
            )
        return ProductService._to_response(product)

    @staticmethod
    def list_products(
        db: Session,
        search: Optional[str] = None,
        category: Optional[str] = None,
        supplier_id: Optional[int] = None,
        page: int = 1,
        size: int = 10,
    ) -> Tuple[List[ProductResponse], int, int]:
        """
        Retrieves a paginated list of products with optional search, category, and supplier filters.
        Returns: (items, total_count, total_pages)
        """
        query = select(Product).options(joinedload(Product.supplier))

        # Search by name or SKU
        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Product.name.ilike(term),
                    Product.sku.ilike(term),
                )
            )

        # Filter by category
        if category and category.strip():
            query = query.where(Product.category.ilike(category.strip()))

        # Filter by supplier ID
        if supplier_id is not None:
            query = query.where(Product.supplier_id == supplier_id)

        # Total count query matching the filters
        count_query = select(func.count()).select_from(query.subquery())
        total = db.execute(count_query).scalar() or 0

        # Pagination calculations
        pages = math.ceil(total / size) if total > 0 else 1
        offset = (page - 1) * size

        # Fetch page items ordered by id
        items = db.execute(
            query.order_by(Product.id.asc()).offset(offset).limit(size)
        ).scalars().all()

        return [ProductService._to_response(p) for p in items], total, pages

    @staticmethod
    def update_product(db: Session, product_id: int, product_in: ProductUpdate) -> ProductResponse:
        """
        Updates an existing product's fields. Stock is never updated here.
        """
        product = db.execute(
            select(Product)
            .options(joinedload(Product.supplier))
            .where(Product.id == product_id)
        ).scalar_one_or_none()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {product_id} not found.",
            )

        update_data = product_in.model_dump(exclude_unset=True)

        # Validate supplier_id if provided
        if "supplier_id" in update_data and update_data["supplier_id"] is not None:
            supplier = db.get(Supplier, update_data["supplier_id"])
            if not supplier:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Supplier with ID {update_data['supplier_id']} not found.",
                )

        for field, value in update_data.items():
            if isinstance(value, str):
                value = value.strip()
            setattr(product, field, value)

        db.commit()
        db.refresh(product)
        db.refresh(product, ["supplier"])
        return ProductService._to_response(product)

    @staticmethod
    def delete_product(db: Session, product_id: int) -> None:
        """
        Deletes a product by ID.
        """
        product = db.get(Product, product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {product_id} not found.",
            )
        db.delete(product)
        db.commit()

product_service = ProductService()
