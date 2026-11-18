import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME", "portfolio")
GITHUB_USERNAME = os.getenv("GITHUB_USERNAME", "Dhanush-K-Git")
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY")