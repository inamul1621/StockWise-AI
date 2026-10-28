from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.products import router as products_router
from app.api.v1.inventory import router as inventory_router

api_router = APIRouter()

# Mount health routes
api_router.include_router(health_router, prefix="", tags=["Health"])

# Mount products routes
api_router.include_router(products_router)

# Mount inventory routes
api_router.include_router(inventory_router)
