from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import ALLOWED_ORIGINS
from app.routers import certificates, github, profile, projects, resume

app = FastAPI(title="Portfolio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500", *ALLOWED_ORIGINS],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(certificates.router, prefix="/api/certificates", tags=["certificates"])
app.include_router(github.router, prefix="/api/github", tags=["github"])
app.include_router(resume.router, prefix="/api/resume", tags=["resume"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])


@app.get("/")
def root():
    return {"status": "ok"}
