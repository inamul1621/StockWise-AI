from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

from app.config import settings

# In SQLAlchemy 2.0, DeclarativeBase is the modern standard base class for models
class Base(DeclarativeBase):
    pass

# Create database engine with connection pooling and pre-ping health checks
engine = create_engine(
    settings.sync_database_url,
    pool_pre_ping=True,  # Automatically tests connections before giving them out
    pool_size=10,        # Number of connections to keep open in the pool
    max_overflow=20,     # Max extra temporary connections under heavy load
    echo=settings.DEBUG, # Logs SQL statements in debug mode
)

# Session factory bound to engine
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides an isolated database session per request.
    Ensures the session is cleanly closed even if an exception occurs.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
