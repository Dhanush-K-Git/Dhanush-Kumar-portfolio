from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import projects, certificates, github

app = FastAPI(title="Portfolio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(certificates.router, prefix="/api/certificates", tags=["certificates"])
app.include_router(github.router, prefix="/api/github", tags=["github"])

@app.get("/")
def root():
    return {"status": "ok"}