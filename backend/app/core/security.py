import hmac
import hashlib
import secrets
from typing import Optional
from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader

from app.config import settings

# API Key header dependency
API_KEY_HEADER_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_HEADER_NAME, auto_error=False)


def verify_api_key(api_key: Optional[str] = Security(api_key_header)) -> Optional[str]:
    """
    Validates the X-API-Key header against settings.API_KEY.
    - If settings.API_KEY is None or empty: Authentication is disabled (open dev mode).
    - If settings.API_KEY is configured: Requires valid API Key using constant-time comparison.
    """
    if not settings.API_KEY:
        # Auth not enforced if API_KEY is not configured
        return None

    if not api_key or not secrets.compare_digest(api_key.strip(), settings.API_KEY.strip()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API Key in X-API-Key header.",
            headers={"WWW-Authenticate": API_KEY_HEADER_NAME},
        )
    return api_key


def hash_password(password: str, salt: Optional[str] = None) -> str:
    """
    Secure password hashing using NIST-recommended PBKDF2-HMAC-SHA256 with 600,000 iterations.
    Format: salt$hash
    """
    if not salt:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        600_000,
    )
    return f"{salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain password against the PBKDF2-HMAC-SHA256 hash using constant-time comparison.
    """
    try:
        salt, stored_hash = hashed_password.split("$", 1)
        computed_hash = hash_password(plain_password, salt=salt).split("$", 1)[1]
        return secrets.compare_digest(stored_hash, computed_hash)
    except Exception:
        return False
