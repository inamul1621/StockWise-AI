import os
from pathlib import Path
from typing import List, Optional, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables or .env file.
    Includes validation for security settings and environment-based CORS.
    """
    PROJECT_NAME: str = "StockWise AI"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Server binding
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # PostgreSQL Database credentials
    POSTGRES_SERVER: str = "127.0.0.1"
    POSTGRES_PORT: int = 5433
    POSTGRES_USER: str = "stockwise_user"
    POSTGRES_PASSWORD: str = "stockwise_pass"
    POSTGRES_DB: str = "stockwise_db"
    DATABASE_URL: Optional[str] = None

    # CORS Allowlist - explicit list of allowed frontend origins
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # Optional API Key for route protection
    API_KEY: Optional[str] = None

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    @property
    def sync_database_url(self) -> str:
        """
        Constructs a psycopg 3 compatible database URL if DATABASE_URL is not set directly.
        """
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return (
            f"postgresql+psycopg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    def validate_security_configuration(self) -> None:
        """
        Validates critical configuration at startup and fails fast with clear errors
        if required settings are missing or insecure in production.
        """
        # 1. Essential database parameters must not be empty
        missing_db_fields = []
        if not self.POSTGRES_USER:
            missing_db_fields.append("POSTGRES_USER")
        if not self.POSTGRES_PASSWORD:
            missing_db_fields.append("POSTGRES_PASSWORD")
        if not self.POSTGRES_DB:
            missing_db_fields.append("POSTGRES_DB")
        if not self.POSTGRES_SERVER:
            missing_db_fields.append("POSTGRES_SERVER")

        if missing_db_fields:
            raise ValueError(
                f"Configuration Error: Missing required database settings: {', '.join(missing_db_fields)}"
            )

        # 2. Strict production safety checks
        if self.ENVIRONMENT.lower() == "production":
            if self.DEBUG:
                raise ValueError("Security Violation: DEBUG mode must be False in production.")

            insecure_passwords = {"stockwise_pass", "postgres", "password", "123456", "admin"}
            if self.POSTGRES_PASSWORD.lower() in insecure_passwords:
                raise ValueError(
                    "Security Violation: Insecure default database password detected in production. "
                    "Please configure a strong POSTGRES_PASSWORD."
                )

            if "*" in self.CORS_ORIGINS:
                raise ValueError(
                    "Security Violation: Unrestricted wildcard '*' is not permitted in CORS_ORIGINS in production."
                )

    model_config = SettingsConfigDict(
        env_file=(BACKEND_DIR / ".env", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
