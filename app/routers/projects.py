from fastapi import APIRouter, HTTPException, Depends
from app.security import require_admin
from bson import ObjectId
from bson.errors import InvalidId
from app.database import projects_collection
from app.models.project import Project, project_helper

router = APIRouter()

@router.get("/")
def get_projects():
    projects = projects_collection.find()
    return [project_helper(p) for p in projects]

@router.get("/{project_id}")
def get_project(project_id: str):
    try:
        project = projects_collection.find_one({"_id": ObjectId(project_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid project ID")
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project_helper(project)

@router.post("/", dependencies=[Depends(require_admin)])
def create_project(project: Project):
    result = projects_collection.insert_one(project.dict())
    created = projects_collection.find_one({"_id": result.inserted_id})
    return project_helper(created)

@router.put("/{project_id}", dependencies=[Depends(require_admin)])
def update_project(project_id: str, project: Project):
    try:
        oid = ObjectId(project_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid project ID")
    result = projects_collection.update_one({"_id": oid}, {"$set": project.dict()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    updated = projects_collection.find_one({"_id": oid})
    return project_helper(updated)

@router.delete("/{project_id}", dependencies=[Depends(require_admin)])
def delete_project(project_id: str):
    try:
        oid = ObjectId(project_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid project ID")
    result = projects_collection.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted"}