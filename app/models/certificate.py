from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone


class Certificate(BaseModel):
    title: str
    issuer: str
    issued_date: Optional[str] = None   # e.g. "2026-03"
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None
    image_url: Optional[str] = None
    featured: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


def certificate_helper(cert, has_file: bool = False) -> dict:
    return {
        "id": str(cert["_id"]),
        "title": cert["title"],
        "issuer": cert["issuer"],
        "issued_date": cert.get("issued_date"),
        "credential_id": cert.get("credential_id"),
        "credential_url": cert.get("credential_url"),
        "image_url": cert.get("image_url"),
        "featured": cert.get("featured", False),
        "created_at": cert.get("created_at"),
        "has_file": has_file,
    }
