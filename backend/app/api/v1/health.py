from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db

router = APIRouter()

class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    environment: str
    database: str

@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health & Database Connectivity Check",
)
def health_check(db: Session = Depends(get_db)):
    """
    Checks the service health and verifies live PostgreSQL connectivity.
    """
    db_status = "connected"
    try:
        # Minimal query to test database connectivity
        result = db.execute(text("SELECT 1")).scalar()
        if result != 1:
            db_status = "unexpected_response"
    except Exception as e:
        db_status = f"disconnected: {e}"

    is_healthy = db_status == "connected"
    payload = HealthResponse(
        status="ok" if is_healthy else "degraded",
        app_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        database=db_status,
    )

    if not is_healthy:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=payload.model_dump(),
        )

    return payload
