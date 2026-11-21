from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.database import profile_collection, resume_files_collection
from app.models.profile import QuickView
from app.security import require_admin

router = APIRouter()


@router.get("/")
def get_profile():
    doc = profile_collection.find_one({"_id": "main"}) or {}
    return {
        "resume": doc.get("resume"),
        "quick_view": doc.get("quick_view", QuickView().model_dump()),
        "has_resume_file": resume_files_collection.count_documents({"_id": "current"}, limit=1) > 0,
        "updated_at": doc.get("updated_at"),
    }


@router.put("/quick-view", dependencies=[Depends(require_admin)])
def update_quick_view(qv: QuickView):
    profile_collection.update_one(
        {"_id": "main"},
        {"$set": {"quick_view": qv.model_dump(), "updated_at": datetime.now(timezone.utc)}},
        upsert=True,
    )
    return qv