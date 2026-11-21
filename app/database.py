from pymongo import MongoClient
from app.config import MONGODB_URI, DB_NAME

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]

projects_collection = db["projects"]
certificates_collection = db["certificates"]
certificate_files_collection = db["certificate_files"]
profile_collection = db["profile"]
resume_files_collection = db["resume_files"]
