from fastapi import APIRouter
from pydantic import BaseModel
from app.config import settings

router = APIRouter()

class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    environment: str

@router.get("/health", response_model=HealthResponse, summary="Health Check")
def health_check() -> HealthResponse:
    """
    Returns the basic health status and metadata of the API service.
    """
    return HealthResponse(
        status="ok",
        app_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
    )
