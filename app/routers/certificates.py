from fastapi import APIRouter, HTTPException, Depends
from app.security import require_admin
from bson import ObjectId
from bson.errors import InvalidId
from app.database import certificates_collection
from app.models.certificate import Certificate, certificate_helper

router = APIRouter()

@router.get("/")
def get_certificates():
    return [certificate_helper(c) for c in certificates_collection.find()]

@router.get("/{cert_id}")
def get_certificate(cert_id: str):
    try:
        cert = certificates_collection.find_one({"_id": ObjectId(cert_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid certificate ID")
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return certificate_helper(cert)

@router.post("/", dependencies=[Depends(require_admin)])
def create_certificate(cert: Certificate):
    result = certificates_collection.insert_one(cert.model_dump())
    created = certificates_collection.find_one({"_id": result.inserted_id})
    return certificate_helper(created)

@router.put("/{project_id}", dependencies=[Depends(require_admin)])
def update_certificate(cert_id: str, cert: Certificate):
    try:
        oid = ObjectId(cert_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid certificate ID")
    result = certificates_collection.update_one({"_id": oid}, {"$set": cert.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return certificate_helper(certificates_collection.find_one({"_id": oid}))

@router.delete("/{project_id}", dependencies=[Depends(require_admin)])
def delete_certificate(cert_id: str):
    try:
        oid = ObjectId(cert_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid certificate ID")
    result = certificates_collection.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return {"message": "Certificate deleted"}