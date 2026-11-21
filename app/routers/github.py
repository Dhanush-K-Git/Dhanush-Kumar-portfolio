import time

import httpx
from fastapi import APIRouter, HTTPException

from app.config import GITHUB_TOKEN, GITHUB_USERNAME

router = APIRouter()

CACHE_SECONDS = 3600
HIDDEN_REPOS = {"add-repo-names-you-want-hidden-here"}
_cache = {"data": None, "fetched_at": 0.0}


def fetch_repos(use_token: bool) -> list:
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "portfolio-backend"}
    if use_token and GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    res = httpx.get(
        f"https://api.github.com/users/{GITHUB_USERNAME}/repos",
        params={"per_page": 100, "sort": "pushed", "type": "owner"},
        headers=headers,
        timeout=10,
    )
    res.raise_for_status()
    return res.json()


@router.get("/repos")
def get_repos():
    now = time.time()
    if _cache["data"] is not None and now - _cache["fetched_at"] < CACHE_SECONDS:
        return _cache["data"]

    try:
        try:
            raw = fetch_repos(use_token=True)
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401 and GITHUB_TOKEN:
                raw = fetch_repos(use_token=False)  # token expired or invalid: try without it
            else:
                raise
    except httpx.HTTPStatusError as e:
        status = e.response.status_code
        print(f"GitHub API error: {status}")
        if _cache["data"] is not None:
            return _cache["data"]  # serve the last good copy
        raise HTTPException(status_code=502, detail=f"GitHub returned {status}")
    except httpx.HTTPError as e:
        print(f"GitHub unreachable: {e.__class__.__name__}")
        if _cache["data"] is not None:
            return _cache["data"]
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
        for r in raw
        if not r["fork"] and not r["archived"] and r["name"] not in HIDDEN_REPOS
    ]
    _cache.update(data=repos, fetched_at=now)
    return repos
