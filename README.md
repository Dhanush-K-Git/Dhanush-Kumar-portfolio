# Dhanush Kumar: AI Engineer Portfolio

A portfolio site where the content lives in a database, so it can change without redeploying. Upload a new resume and the experience, education and skills update. Repositories come live from GitHub. Certificates carry viewable PDFs. A protected admin page manages it all.

**Live site:** see the link in this repository's About panel.

## What it does

- **Resume-driven content:** upload a PDF on the admin page, an LLM drafts experience, education and skills as JSON, you review and edit the draft, then publish. The resume PDF is stored and served as the download button.
- **Live GitHub feed:** the backend reads the public repositories, skips forks and archived repos, and caches the result for an hour.
- **Certificates with PDFs:** each certificate can have its PDF attached, so a recruiter can open the original from the page.
- **Recruiter quick view:** availability, work preference and locations, editable from the admin page.
- **Admin page:** key-protected, with no login system to maintain.
- **Frontend details:** light and dark themes, responsive layout, reduced-motion support.

## Architecture

```
Browser --> static frontend --> FastAPI --> MongoDB Atlas
                                  |-- GitHub REST API  (repositories, cached 1 hour)
                                  '-- Groq API         (resume extraction, admin only)
```

| Content | Source | How it updates |
|---|---|---|
| Experience, education, skills, resume PDF | MongoDB | Upload on `admin.html`, review, publish |
| Certificates and their PDFs | MongoDB | Admin page |
| GitHub repositories | GitHub REST API | Automatic, cached for an hour |
| Recruiter quick view | MongoDB | Admin page |
| Name, email, city | `frontend/js/config.js` | Edit the file |

## Project structure

```
app/
  main.py            FastAPI app, CORS, routers
  config.py          environment variables
  database.py        MongoDB collections
  security.py        admin key check
  models/            Pydantic models (certificate, profile, project)
  routers/           certificates, github, resume, profile, projects
frontend/
  index.html         public site
  admin.html         admin page
  css/               style.css, fixes.css
  js/                config.js, main.js, admin.js
start.ps1            starts backend and frontend on Windows
```

## API

| Method | Path | Access |
|---|---|---|
| GET | `/api/certificates/`, `/api/certificates/{id}` | public |
| GET | `/api/certificates/{id}/file` | public (PDF) |
| POST, PUT, DELETE | `/api/certificates/...` and `/api/certificates/{id}/file` | admin key |
| GET | `/api/github/repos` | public |
| GET | `/api/profile/` | public |
| PUT | `/api/profile/quick-view` | admin key |
| POST | `/api/resume/extract`, `/api/resume/publish` | admin key |
| GET | `/api/resume/download` | public (PDF) |

`/api/projects` also exists but the site no longer uses it, because the GitHub feed covers that need.
Interactive docs: `/docs` on the running backend.

## Environment variables

Copy `.env.example` to `.env` and fill it in. `.env` is never committed.

| Name | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `DB_NAME` | database name (default `portfolio`) |
| `ADMIN_API_KEY` | secret for write endpoints, typed on the admin page |
| `GROQ_API_KEY` | key for resume extraction |
| `GROQ_MODEL` | model name; change it if Groq retires the current one |
| `GITHUB_USERNAME` | whose repositories to show |
| `ALLOWED_ORIGINS` | comma-separated frontend URLs allowed by CORS |

## Run locally

```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Or in two terminals from the project root:

```powershell
uvicorn app.main:app --reload
python -m http.server 5500 --directory frontend
```

Site: `http://127.0.0.1:5500` | Admin: `http://127.0.0.1:5500/admin.html` | API docs: `http://127.0.0.1:8000/docs`

## Deployment

- **Backend (Render, free web service):** build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, with the environment variables above. Set `PYTHON_VERSION` to a full version such as the one used locally.
- **Frontend (Vercel):** import the repository and set the root directory to `frontend`, with no build step.
- Set `ALLOWED_ORIGINS` on the backend to the Vercel URL, and set the backend URL in `frontend/js/config.js`.
- Free Render services sleep when idle, so the first request after a pause can take up to a minute. The page shows a message while it waits.

## Decisions worth explaining

- **Vanilla JavaScript:** the site is a handful of pages, so a framework and build step would add weight without adding value.
- **MongoDB:** the content is document-shaped and changes shape often, so there are no migrations.
- **Review before publish:** an LLM can misread a PDF, so the extracted draft is shown for editing first and the model's output is validated against a schema.
- **GitHub fetched by the backend:** it can cache, filter and survive GitHub being unreachable by serving the last good copy.
- **No public chatbot:** an open LLM endpoint on a public site has unbounded cost, so LLM calls are limited to the key-protected admin page.

## Security notes

- Reads are public. Every write needs the admin key, compared in constant time.
- Uploads are checked: PDFs only, resume under 2 MB and certificates under 3 MB, with the file signature verified, not just the extension.
- Resume text is treated as untrusted input to the model.
- Database text is inserted with `textContent`, and links are limited to http(s), so stored values cannot inject HTML or scripts.

## Possible next steps

- Contact form saved to the database, with spam protection
- Removing the unused projects endpoints
