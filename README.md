# Resume Screening Assistant

A web-based recruitment and resume screening platform built with Python (Flask) and a vanilla JavaScript frontend. It facilitates transparent, grounded resume matching against specific job opening requirements, featuring dedicated portals for candidates and recruiters.

---

## Key Capabilities

* **Role-Based Access Control**:
  * **Candidate Portal**: Browse active job openings, submit multi-page resumes (PDF / DOCX), track real-time application status, and view objective requirement match breakdowns.
  * **Recruiter / Admin Portal**: Publish job vacancies with automated NLP requirement extraction, review applicants with grounded sentence-by-sentence evidence, record confidential recruiter notes, and configure scoring weight distributions.
* **Objective Requirement Matching**:
  * Evaluates candidates across 7 configurable dimensions: Required Skills (30%), Experience (25%), Technical Skills (15%), Projects (10%), Education (10%), Preferred Skills (5%), and Certifications (5%).
  * Real-time validation ensures weights sum to exactly 100%.
* **Grounding Evidence Matrix**:
  * Extracts exact sentences and bullet points from the resume for each requirement, categorizing them into `Matched`, `Partially Matched`, or `Not Detected`.
* **Data Privacy**:
  * Recruiter notes, internal ratings, and audit histories are strictly filtered out on candidate endpoints.
  * Duplicate application prevention per candidate and job opening.
* **Selective Design System (Emerald + Champagne Theme)**:
  * **Primary Brand Color**: Emerald (`#064E3B`) for headers, navigation, primary buttons, borders, and major visual elements.
  * **Secondary Brand Color**: Champagne (`#F8E7C9`) for highlight cards, badges, accents, and elegant decorative elements.
  * **Supporting Palette**: Deep Emerald (`#022C22`), Soft Cream (`#FFFDF8`), Dark Text (`#1F2937`), Muted Text (`#6B7280`), and Pure White (`#FFFFFF`).
  * Visually engaging hero showcase, split authentication cards, and 10 custom vector SVG icon assets across all candidate and recruiter views.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.10+, Flask 3.1, Werkzeug (Session auth & security) |
| **Database & ORM** | SQLite (default development) / PostgreSQL ready, SQLAlchemy 2.0 |
| **Document Processing** | `pypdf` (PDF extraction), `python-docx` (Word extraction), `scikit-learn` (TF-IDF Cosine Similarity) |
| **Frontend** | HTML5, Vanilla CSS Design System (Custom properties, responsive grid), Vanilla ES6 JavaScript (Hash SPA router) |
| **Testing** | `pytest`, custom live-server verification suite |

---

## Project Structure

```
resume-screening-assistant/
├── backend/
│   └── app/
│       ├── __init__.py           # Flask application factory & database migration checks
│       ├── config.py             # App configuration & upload paths
│       ├── database.py           # SQLAlchemy database instance
│       ├── models/               # Data models (User, Job, Application, Candidate, Resume, Screening)
│       ├── routes/               # API Blueprints (Auth, Applications, Jobs, Screening, Reports, Settings)
│       ├── services/             # Core logic (Document parsers, NLP analyzer, Match engine)
│       └── utils/                # Auth decorators, logging, PDF export helpers
├── frontend/
│   ├── static/
│   │   ├── css/                  # CSS Design System (variables.css, base.css, components.css)
│   │   └── js/                   # SPA architecture (app.js, api.js, state.js, views/)
│   └── templates/
│       └── index.html            # Single Page Application HTML shell
├── tests/                        # Automated unit, integration, and E2E test suite
├── uploads/                      # Uploaded resume documents (gitignored)
├── requirements.txt              # Python dependencies
├── run.py                        # Application entry point
└── test_live_server.py           # End-to-end live API verification script
```

---

## Quickstart & Installation

### 1. Clone & Set Up Virtual Environment

```bash
git clone <repo-url>
cd "RESUME SCREENING ASSISTANT"

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS / Linux:
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Application

```bash
python run.py
```

The application will be running at **`http://127.0.0.1:5000`**.

---

## Default Accounts for Testing

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin (Recruiter)** | `admin@resumescreening.com` | `AdminPassword123!` | Full dashboard, job publishing, applicant screening, scoring weights |
| **Demo Candidate** | `candidate@example.com` | `CandidatePassword123!` | Job browsing, resume upload, application tracking, candidate profile |

> **Tip**: You can also register a new candidate account directly from the **Candidate Registration** screen.

---

## Running Automated Tests

Run the complete test suite using `pytest`:

```bash
pytest -v
```

To run the live server full workflow verification test against a running instance:

```bash
python test_live_server.py
```

---

## API Overview

### Authentication
* `POST /api/auth/register` — Candidate account creation.
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
