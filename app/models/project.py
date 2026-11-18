from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone

class Project(BaseModel):
    title: str
    description: str
    tech_stack: List[str]
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    image_url: Optional[str] = None
    featured: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


def project_helper(project) -> dict:
    return {
        "id": str(project["_id"]),
        "title": project["title"],
        "description": project["description"],
        "tech_stack": project["tech_stack"],
        "github_url": project.get("github_url"),
        "live_url": project.get("live_url"),
        "image_url": project.get("image_url"),
        "featured": project.get("featured", False),
        "created_at": project.get("created_at"),
    }