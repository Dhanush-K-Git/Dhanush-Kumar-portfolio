from datetime import datetime, timezone

from bson import Binary, ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response

from app.database import certificate_files_collection, certificates_collection
from app.models.certificate import Certificate, certificate_helper
from app.security import require_admin

router = APIRouter()

MAX_FILE_BYTES = 3 * 1024 * 1024


def to_oid(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid certificate ID")


def has_file(cert_id: str) -> bool:
    return certificate_files_collection.count_documents({"_id": cert_id}, limit=1) > 0


@router.get("/")
def get_certificates():
    certs = list(certificates_collection.find())
    ids = [str(c["_id"]) for c in certs]
    with_files = {d["_id"] for d in certificate_files_collection.find({"_id": {"$in": ids}}, {"_id": 1})}
    return [certificate_helper(c, str(c["_id"]) in with_files) for c in certs]


@router.get("/{cert_id}")
def get_certificate(cert_id: str):
    cert = certificates_collection.find_one({"_id": to_oid(cert_id)})
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return certificate_helper(cert, has_file(cert_id))


@router.post("/", dependencies=[Depends(require_admin)])
def create_certificate(cert: Certificate):
    result = certificates_collection.insert_one(cert.model_dump())
    created = certificates_collection.find_one({"_id": result.inserted_id})
    return certificate_helper(created, False)


@router.put("/{cert_id}", dependencies=[Depends(require_admin)])
def update_certificate(cert_id: str, cert: Certificate):
    oid = to_oid(cert_id)
    result = certificates_collection.update_one({"_id": oid}, {"$set": cert.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return certificate_helper(certificates_collection.find_one({"_id": oid}), has_file(cert_id))


@router.delete("/{cert_id}", dependencies=[Depends(require_admin)])
def delete_certificate(cert_id: str):
    result = certificates_collection.delete_one({"_id": to_oid(cert_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Certificate not found")
    certificate_files_collection.delete_one({"_id": cert_id})
    return {"message": "Certificate deleted"}


@router.post("/{cert_id}/file", dependencies=[Depends(require_admin)])
def upload_certificate_file(cert_id: str, file: UploadFile = File(...)):
    oid = to_oid(cert_id)
    if not certificates_collection.find_one({"_id": oid}, {"_id": 1}):
        raise HTTPException(status_code=404, detail="Certificate not found")

    data = file.file.read(MAX_FILE_BYTES + 1)
    if len(data) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="PDF must be under 3 MB")
    if not data.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="File is not a PDF")

    certificate_files_collection.replace_one(
        {"_id": cert_id},
        {"_id": cert_id, "content": Binary(data), "size": len(data), "uploaded_at": datetime.now(timezone.utc)},
        upsert=True,
    )
    return {"message": "File saved"}


@router.get("/{cert_id}/file")
def download_certificate_file(cert_id: str):
    to_oid(cert_id)
    doc = certificate_files_collection.find_one({"_id": cert_id})
    if not doc:
        raise HTTPException(status_code=404, detail="No file for this certificate")
    return Response(
        content=bytes(doc["content"]),
        media_type="application/pdf",
        headers={"Content-Disposition": 'inline; filename="certificate.pdf"'},
    )
