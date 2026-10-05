import pytest
import json
from backend.app import create_app
from backend.app.config import Config
from backend.app.database import db
from backend.app.models import Job, Candidate, Resume, CandidateSkill, Experience, Education, Project
from backend.app.screening.matcher import match_candidate_to_job, get_current_weights, DEFAULT_WEIGHTS
from backend.app.screening.grounding import generate_requirement_matrix
from backend.app.screening.explanation import generate_screening_explanation

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

@pytest.fixture
def app_context():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

def test_matching_strong_candidate(app_context):
    job = Job(
        title="Senior Python Backend Engineer",
        raw_description="Requires 4+ years experience with Python, FastAPI, Docker, and PostgreSQL.",
        min_experience_years=4.0,
        education_level="Bachelor's Degree",
        required_skills=json.dumps(["Python", "FastAPI", "Docker", "PostgreSQL"]),
        preferred_skills=json.dumps(["AWS", "React"])
    )
    db.session.add(job)
    db.session.flush()

    cand = Candidate(
        full_name="Alex Strong",
        email="alex@strong.com",
        total_experience_years=5.0,
        highest_education="Bachelor of Science in Computer Science",
        professional_summary="Senior developer with 5 years experience in Python, FastAPI, Docker, and PostgreSQL."
    )
    db.session.add(cand)
    db.session.flush()

    resume = Resume(
        candidate_id=cand.id,
        filename="alex.pdf",
        file_path="uploads/alex.pdf",
        file_type="pdf",
        raw_text="Alex Strong. Experienced in Python, FastAPI, Docker, PostgreSQL, and AWS for 5 years."
    )
    db.session.add(resume)
    for s in ["Python", "FastAPI", "Docker", "PostgreSQL", "AWS"]:
        db.session.add(CandidateSkill(candidate_id=cand.id, name=s, category="technical"))

    db.session.commit()

    match_result = match_candidate_to_job(cand, job)
    assert match_result['overall_match_score'] >= 75.0
    assert "Python" in match_result['matched_requirements']
    assert "FastAPI" in match_result['matched_requirements']
    assert len(match_result['missing_requirements']) == 0
    assert len(match_result['matrix']) > 0

def test_matching_junior_candidate_experience_gap(app_context):
    job = Job(
        title="Lead Architect",
        min_experience_years=8.0,
        required_skills=json.dumps(["Python", "Kubernetes", "Distributed Systems"])
    )
    db.session.add(job)
    db.session.flush()

    cand = Candidate(
        full_name="Junior Dev",
        total_experience_years=1.0,
        highest_education="Bachelor's Degree"
    )
    db.session.add(cand)
    db.session.flush()

    db.session.add(Resume(
        candidate_id=cand.id,
        filename="jr.pdf",
        file_path="uploads/jr.pdf",
        file_type="pdf",
        raw_text="Junior Dev. 1 year experience in Python."
    ))
    db.session.add(CandidateSkill(candidate_id=cand.id, name="Python", category="technical"))
    db.session.commit()

    match_result = match_candidate_to_job(cand, job)
    assert match_result['overall_match_score'] < 60.0
    assert any("below" in c.lower() or "experience" in c.lower() for c in match_result['potential_concerns'])

def test_grounding_matrix_evidence(app_context):
    job = Job(
        title="Python Engineer",
        required_skills=json.dumps(["Python", "PostgreSQL"]),
        min_experience_years=3.0,
        education_level="Bachelor's Degree"
    )
    db.session.add(job)
    db.session.flush()

    cand = Candidate(
        full_name="Sam Sample",
        total_experience_years=3.5,
        highest_education="Bachelor of Science"
    )
    db.session.add(cand)
    db.session.flush()

    resume_text = "Developed high performance database queries in PostgreSQL and Python for 3.5 years."
    db.session.add(Resume(
        candidate_id=cand.id,
        filename="sam.pdf",
        file_path="uploads/sam.pdf",
        file_type="pdf",
        raw_text=resume_text
    ))
    db.session.add(CandidateSkill(candidate_id=cand.id, name="Python", category="technical"))
    db.session.commit()

    matrix = generate_requirement_matrix(job, cand, resume_text)
    assert len(matrix) >= 3
    py_match = next((m for m in matrix if m['requirement_title'] == 'Python'), None)
    assert py_match is not None
    assert py_match['match_status'] == 'Matched'
    assert "Python" in py_match['candidate_evidence'] or "skills profile" in py_match['candidate_evidence']

def test_screening_explanation_responsible_disclosure():
    cand = type('obj', (object,), {
        'full_name': 'Taylor Swift',
        'total_experience_years': 4.0,
        'highest_education': "Bachelor's Degree",
        'projects': [],
        'experiences': []
    })
    job = type('obj', (object,), {
        'min_experience_years': 3.0
    })
    summary, verify = generate_screening_explanation(
        candidate=cand,
        job=job,
        matched_reqs=['Python', 'SQL'],
        missing_reqs=['Docker'],
        partial_reqs=[],
        scores={'projects': 30}
    )
    assert "Python" in summary
    assert "Docker" in verify
    # Verify no personal demographic terms
    assert "gender" not in summary.lower()
    assert "age" not in summary.lower()
