from pymongo import MongoClient
from app.config import MONGODB_URI, DB_NAME

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]

projects_collection = db["projects"]
certificates_collection = db["certificates"]