import io
import os
import pytest
from backend.app import create_app
from backend.app.config import Config
from backend.app.database import db

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    UPLOAD_FOLDER = 'tests/test_uploads'

@pytest.fixture
def client():
    app = create_app(TestConfig)
    os.makedirs(TestConfig.UPLOAD_FOLDER, exist_ok=True)
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.session.remove()
            db.drop_all()

def test_create_and_get_job(client):
    # 1. Create Job
    res = client.post('/api/jobs', json={
        'title': 'Senior Python Architect',
        'department': 'Cloud Engineering',
        'location': 'Remote',
        'raw_description': 'Must have 5+ years of experience with Python, FastAPI, Docker, and PostgreSQL.',
        'min_experience_years': 5.0
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data['job']['title'] == 'Senior Python Architect'
    job_id = data['job']['id']

    # 2. Get Job List
    list_res = client.get('/api/jobs')
    assert list_res.status_code == 200
    assert len(list_res.get_json()['jobs']) == 1

    # 3. Get Single Job
    single_res = client.get(f'/api/jobs/{job_id}')
    assert single_res.status_code == 200
    assert len(single_res.get_json()['requirements']) >= 1

def test_resume_upload_and_screening(client):
    # Create Job first
    job_res = client.post('/api/jobs', json={
        'title': 'Full-Stack Developer',
        'raw_description': 'Need Python, React, PostgreSQL with 3+ years experience.'
    })
    job_id = job_res.get_json()['job']['id']

    # Upload sample PDF
    pdf_path = "sample_resumes/sample_strong_fullstack.pdf"
    with open(pdf_path, 'rb') as f:
        data = {
            'job_id': str(job_id),
            'files': (io.BytesIO(f.read()), 'sample_strong_fullstack.pdf')
        }
        upload_res = client.post('/api/resumes/upload', data=data, content_type='multipart/form-data')

    assert upload_res.status_code == 200
    results = upload_res.get_json()['results']
    assert len(results) == 1
    assert results[0]['status'] == 'success'
    cand_id = results[0]['candidate_id']
    assert results[0]['match_score'] is not None

    # Get Candidate details
    cand_res = client.get(f'/api/candidates/{cand_id}')
    assert cand_res.status_code == 200
    cand_data = cand_res.get_json()
    assert cand_data['full_name'] == "Elena Rostova"
    assert cand_data['screening'] is not None
    assert len(cand_data['skills']) > 0

def test_candidate_status_and_notes(client):
    # Seed demo data
    client.post('/api/settings/demo/seed')
    
    # Get candidates
    cands_res = client.get('/api/candidates')
    candidates = cands_res.get_json()['candidates']
    assert len(candidates) > 0
    cand_id = candidates[0]['id']

    # Update status to Shortlisted
    status_res = client.put(f'/api/candidates/{cand_id}/status', json={
        'status': 'Shortlisted',
        'note': 'Passed initial screening.'
    })
    assert status_res.status_code == 200
    assert status_res.get_json()['candidate']['status'] == 'Shortlisted'

    # Add Note
    note_res = client.post(f'/api/candidates/{cand_id}/notes', json={
        'content': 'Schedule technical phone screen next Tuesday.',
        'author': 'Lead Recruiter'
    })
    assert note_res.status_code == 201
    assert note_res.get_json()['note']['content'] == 'Schedule technical phone screen next Tuesday.'

def test_side_by_side_comparison(client):
    client.post('/api/settings/demo/seed')
    cands = client.get('/api/candidates').get_json()['candidates']
    assert len(cands) >= 2
    
    compare_res = client.post('/api/screening/compare', json={
        'candidate_ids': [cands[0]['id'], cands[1]['id']]
    })
    assert compare_res.status_code == 200
    data = compare_res.get_json()
    assert len(data['candidates']) == 2
    assert 'match_score' in data['candidates'][0]

def test_analytics_and_export(client):
    client.post('/api/settings/demo/seed')

    # Analytics
    analytics_res = client.get('/api/reports/analytics')
    assert analytics_res.status_code == 200
    assert analytics_res.get_json()['summary']['total_candidates'] > 0

    # CSV Export
    csv_res = client.get('/api/reports/export/csv')
    assert csv_res.status_code == 200
    assert "Candidate ID,Candidate Name" in csv_res.get_data(as_text=True)

    # PDF Export
    pdf_res = client.get('/api/reports/export/pdf')
    assert pdf_res.status_code == 200
    assert pdf_res.mimetype == 'application/pdf'
    assert len(pdf_res.data) > 1000

def test_settings_scoring_weights_validation(client):
    # Invalid weights sum != 100
    bad_res = client.put('/api/settings/weights', json={
        'weights': {
            'required_skills': 50,
            'experience': 25,
            'technical_skills': 15,
            'projects': 10,
            'education': 10,
            'preferred_skills': 5,
            'certifications': 5
        } # sums to 120
    })
    assert bad_res.status_code == 400
    assert "must sum exactly to 100%" in bad_res.get_json()['error']

    # Valid weights
    good_res = client.put('/api/settings/weights', json={
        'weights': {
            'required_skills': 40,
            'experience': 20,
            'technical_skills': 15,
            'projects': 10,
            'education': 5,
            'preferred_skills': 5,
            'certifications': 5
        }
    })
    assert good_res.status_code == 200
    assert good_res.get_json()['weights']['required_skills'] == 40
