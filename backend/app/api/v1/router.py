from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.products import router as products_router
from app.api.v1.inventory import router as inventory_router
from app.api.v1.suppliers import router as suppliers_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.reports import router as reports_router

api_router = APIRouter()

# Mount health routes
api_router.include_router(health_router, prefix="", tags=["Health"])

# Mount suppliers routes
api_router.include_router(suppliers_router)

# Mount products routes
api_router.include_router(products_router)

# Mount inventory routes
api_router.include_router(inventory_router)

# Mount dashboard routes
api_router.include_router(dashboard_router)

# Mount reports routes
api_router.include_router(reports_router)
