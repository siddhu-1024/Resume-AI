# Resume-AI — Intelligent Resume Screening & Recruitment Platform

A modern, production-ready AI-assisted recruitment and resume screening platform built with Python (Flask) and a premium **Glassmorphism Design System** single-page application (SPA). It provides transparent, requirement-grounded resume matching against job openings, featuring dedicated portals for candidates and recruiters.

---

## Key Capabilities

* **Role-Based Access Control**:
  * **Candidate Portal**: Browse active job vacancies, upload multi-page resumes (PDF / DOCX), track real-time application status, and view objective requirement match breakdowns.
  * **Recruiter / Admin Portal**: Publish job vacancies with automated NLP requirement extraction, review applicants with grounded sentence-by-sentence evidence, record confidential recruiter notes, and configure scoring weight distributions.
* **Objective Requirement Matching**:
  * Evaluates candidates across 7 configurable dimensions: Required Skills (30%), Experience (25%), Technical Skills (15%), Projects (10%), Education (10%), Preferred Skills (5%), and Certifications (5%).
  * Real-time validation ensures weights sum to exactly 100%.
* **Grounding Evidence Matrix**:
  * Extracts exact sentences and bullet points from the resume for each requirement, categorizing them into `Matched`, `Partially Matched`, or `Not Detected`.
* **Data Privacy & Security**:
  * Recruiter notes, internal ratings, and audit histories are strictly filtered out on candidate endpoints.
  * Duplicate application prevention per candidate and job opening.
* **Ultra-Premium Glassmorphism Design System**:
  * Translucent frosted glass panels with dynamic `backdrop-filter: blur(20px)` and `-webkit-backdrop-filter` fallbacks for Safari 9+ and iOS.
  * Deep obsidian background with ambient floating aurora mesh light spheres (`.orb-emerald`, `.orb-teal`, `.orb-champagne`, `.orb-indigo`).
  * Specular rim highlights, luminous status indicators, responsive mobile/tablet drawer navigation, and accessible high-contrast typography.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.10+, Flask 3.1, Werkzeug (Session auth & security), Gunicorn (Production WSGI) |
| **Database & ORM** | SQLite (default development) / PostgreSQL ready, SQLAlchemy 2.0 |
| **Document Processing** | `pypdf` (PDF extraction), `python-docx` (Word extraction), `scikit-learn` (TF-IDF Cosine Similarity) |
| **Frontend** | HTML5, Vanilla CSS Glassmorphism Design System (CSS tokens, responsive grid), Vanilla ES6 JavaScript (Hash SPA router) |
| **Deployment** | Render Web Service (`render.yaml` Blueprint, `Procfile`), Gunicorn WSGI |
| **Testing** | `pytest` (21 unit & integration tests), Custom end-to-end live server test suite |

---

## Project Structure

```
Resume-AI/
├── backend/
│   └── app/
│       ├── __init__.py           # Flask app factory, health endpoints & DB setup
│       ├── config.py             # Environment configuration & upload paths
│       ├── database.py           # SQLAlchemy database instance
│       ├── models/               # Data models (User, Job, Application, Candidate, Resume, Screening)
│       ├── routes/               # API Blueprints (Auth, Applications, Jobs, Screening, Reports, Settings)
│       ├── services/             # Core logic (Document parsers, NLP analyzer, Match engine)
│       └── utils/                # Auth decorators, logging, PDF export helpers
├── frontend/
│   ├── static/
│   │   ├── css/                  # Glassmorphism Design System (variables, base, components, dashboard, screening)
│   │   └── js/                   # SPA architecture (app.js, api.js, state.js, views/)
│   └── templates/
│       └── index.html            # Single Page Application HTML shell
├── tests/                        # Automated unit, integration, and E2E test suite
├── uploads/                      # Uploaded resume documents (gitignored)
├── Procfile                      # Production process specification (Gunicorn)
├── render.yaml                   # Render Infrastructure as Code Blueprint
├── requirements.txt              # Production Python dependencies
├── run.py                        # Local execution script & WSGI entry point
└── test_live_server.py           # End-to-end live server validation suite
```

---

## Local Development & Setup

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.11, 3.12, 3.14)
- Git

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/siddhu-1024/Resume-AI.git
cd Resume-AI

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Run the Development Server
```bash
python run.py
```
Open your browser to `http://127.0.0.1:5000`.

### 4. Run Automated Tests
```bash
# Run pytest test suite (21 tests)
pytest tests/

# Run end-to-end live server test suite (10 workflows)
python test_live_server.py
```

---

## Deploying to Render

This repository is pre-configured for automated 1-click deployment to **Render** using either **Render Blueprints** (`render.yaml`) or a standard **Render Web Service**.

### Option A: Render Blueprint (Recommended)
1. Fork or push this repository to GitHub: `https://github.com/siddhu-1024/Resume-AI`.
2. Log in to [Render](https://render.com).
3. In the Render Dashboard, click **New +** > **Blueprint**.
4. Connect the `siddhu-1024/Resume-AI` repository.
5. Render will automatically detect `render.yaml` and configure the Web Service with:
   - **Environment**: Python 3.11.9
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn run:app --bind 0.0.0.0:$PORT --workers 4 --threads 2`
   - **Health Check Path**: `/api/health`
6. Click **Apply** to deploy.

### Option B: Manual Web Service Setup
1. In Render Dashboard, click **New +** > **Web Service**.
2. Connect your `Resume-AI` GitHub repository.
3. Configure the following settings:
   - **Name**: `resume-ai`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn run:app --bind 0.0.0.0:$PORT --workers 4 --threads 2`
   - **Health Check Path**: `/api/health`
4. Under **Environment Variables**, add:
   - `SECRET_KEY`: `<generate-a-random-secret>`
   - `FLASK_ENV`: `production`
   - `PYTHON_VERSION`: `3.11.9`
5. Click **Create Web Service**.

---

## API Overview

### Health & Monitoring
* `GET  /health` & `GET /api/health` — Returns service health status for Render uptime probes.

### Authentication
* `POST /api/auth/register` — Candidate account registration.
* `POST /api/auth/login` — Sign in candidate or admin.
* `GET  /api/auth/me` — Return currently authenticated user session.
* `POST /api/auth/logout` — Terminate session.

### Job Openings
* `GET  /api/jobs` — List job openings (supports `?status=Active`, `?search=...`, `?department=...`).
* `GET  /api/jobs/:id` — Retrieve specific job details and requirements.
* `POST /api/jobs` — Create new job vacancy (Admin only).
* `PUT  /api/jobs/:id` — Update job vacancy (Admin only).
* `DELETE /api/jobs/:id` — Delete job vacancy (Admin only).
* `POST /api/jobs/preview-nlp` — Auto-extract skills and experience target from raw text.

### Applications & Screening
* `POST /api/applications/apply` — Candidate submits resume (`multipart/form-data`) to a job opening.
* `GET  /api/applications/my-applications` — Candidate views their own applications.
* `GET  /api/applications` — Admin views all applicant records (supports `?job_id=...`, `?status=...`, `?search=...`).
* `GET  /api/applications/:id` — Detailed application view with evidence matrix.
* `PUT  /api/applications/:id/status` — Advance candidate pipeline status (Admin only).
* `POST /api/applications/:id/notes` — Add confidential internal recruiter note (Admin only).
* `GET  /api/applications/:id/resume/download` — Secure file download of candidate's submitted resume.

### Platform Settings & Reports
* `GET  /api/settings` — Get current scoring weights and system configuration.
* `PUT  /api/settings` — Update scoring weights (Admin only, requires 100% total sum).
* `POST /api/settings/seed-demo` — Populate demo jobs and applicant records.
* `POST /api/settings/clear-demo` — Clear demo records while preserving user data.
* `GET  /api/reports/analytics` — Funnel analytics, status counts, and position distribution.
* `GET  /api/reports/export/csv` — Download candidate screening spreadsheet.
