import time
import httpx
from fastapi import APIRouter, HTTPException
from app.config import GITHUB_USERNAME

router = APIRouter()

CACHE_SECONDS = 3600
HIDDEN_REPOS = {"add-repo-names-you-want-hidden-here"}
_cache = {"data": None, "fetched_at": 0.0}


@router.get("/repos")
def get_repos():
    now = time.time()
    if _cache["data"] is not None and now - _cache["fetched_at"] < CACHE_SECONDS:
        return _cache["data"]

    try:
        res = httpx.get(
            f"https://api.github.com/users/{GITHUB_USERNAME}/repos",
            params={"per_page": 100, "sort": "pushed", "type": "owner"},
            headers={"Accept": "application/vnd.github+json"},
            timeout=10,
        )
        res.raise_for_status()
    except httpx.HTTPError:
        if _cache["data"] is not None:
            return _cache["data"]  # serve the last good copy
        raise HTTPException(status_code=502, detail="Could not reach GitHub")

    repos = [
        {
            "name": r["name"],
            "description": r["description"],
            "url": r["html_url"],
            "language": r["language"],
            "stars": r["stargazers_count"],
            "topics": r.get("topics", []),
            "updated_at": r["pushed_at"],
        }
        for r in res.json()
        if not r["fork"] and not r["archived"] and r["name"] not in HIDDEN_REPOS
    ]
    _cache.update(data=repos, fetched_at=now)
    return repos