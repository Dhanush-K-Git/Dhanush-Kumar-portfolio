import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME", "portfolio")
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY")
GITHUB_USERNAME = os.getenv("GITHUB_USERNAME", "Dhanush-K-Git")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")  # optional, raises the GitHub API rate limit
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
