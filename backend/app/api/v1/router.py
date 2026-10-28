from fastapi import APIRouter
from app.api.v1.health import router as health_router

api_router = APIRouter()

# Mount health routes
api_router.include_router(health_router, prefix="", tags=["Health"])
