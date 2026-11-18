import secrets
from fastapi import Depends, HTTPException
from fastapi.security import APIKeyHeader
from app.config import ADMIN_API_KEY

api_key_header = APIKeyHeader(name="X-Admin-Key", auto_error=False)

def require_admin(key: str | None = Depends(api_key_header)):
    if not ADMIN_API_KEY:
        raise HTTPException(status_code=503, detail="Admin key not configured")
    if not key or not secrets.compare_digest(key.encode(), ADMIN_API_KEY.encode()):
        raise HTTPException(status_code=401, detail="Invalid admin key")