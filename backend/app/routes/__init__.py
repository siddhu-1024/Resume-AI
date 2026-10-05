from backend.app.routes.auth import auth_bp
from backend.app.routes.applications import applications_bp
from backend.app.routes.jobs import jobs_bp
from backend.app.routes.resumes import resumes_bp
from backend.app.routes.screening import screening_bp
from backend.app.routes.candidates import candidates_bp
from backend.app.routes.reports import reports_bp
from backend.app.routes.settings import settings_bp
from backend.app.routes.ai import ai_bp
from backend.app.routes.activity import activity_bp

__all__ = [
    'auth_bp',
    'applications_bp',
    'jobs_bp',
    'resumes_bp',
    'screening_bp',
    'candidates_bp',
    'reports_bp',
    'settings_bp',
    'ai_bp',
    'activity_bp'
]
