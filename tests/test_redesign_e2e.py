import io
import os
import pytest
from backend.app import create_app
from backend.app.config import Config
from backend.app.database import db
from backend.app.models import User, Job, Application, Candidate, Resume, ScreeningResult

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    UPLOAD_FOLDER = 'tests/test_uploads'
    SECRET_KEY = 'test-secret'

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

def test_candidate_registration_and_login(client):
    # 1. Test validation failure on password mismatch
    res = client.post('/api/auth/register', json={
        'full_name': 'Alice Test',
        'email': 'alice@test.com',
        'password': 'password123',
        'confirm_password': 'mismatch_password'
    })
    assert res.status_code == 400
    assert 'Passwords do not match' in res.get_json()['error']

    # 2. Test successful candidate registration
    res = client.post('/api/auth/register', json={
        'full_name': 'Alice Test',
        'email': 'alice@test.com',
        'password': 'password123',
        'confirm_password': 'password123',
        'phone': '+1 555-0100',
        'location': 'Seattle, WA'
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data['user']['email'] == 'alice@test.com'
    assert data['user']['role'] == 'candidate'

    # 3. Test duplicate email registration failure
    res_dup = client.post('/api/auth/register', json={
        'full_name': 'Alice Test 2',
        'email': 'alice@test.com',
        'password': 'password123',
        'confirm_password': 'password123'
    })
    assert res_dup.status_code == 409

    # 4. Test login
    res_login = client.post('/api/auth/login', json={
        'email': 'alice@test.com',
        'password': 'password123',
        'expected_role': 'candidate'
    })
    assert res_login.status_code == 200
    assert res_login.get_json()['user']['role'] == 'candidate'

    # 5. Check /api/auth/me
    res_me = client.get('/api/auth/me')
    assert res_me.status_code == 200
    assert res_me.get_json()['authenticated'] is True
    assert res_me.get_json()['user']['email'] == 'alice@test.com'

def test_admin_authentication_and_protection(client):
    # Admin is auto-seeded on first login check
    res_admin = client.post('/api/auth/login', json={
        'email': 'admin@resumescreening.com',
        'password': 'AdminPassword123!',
        'expected_role': 'admin'
    })
    assert res_admin.status_code == 200
    assert res_admin.get_json()['user']['role'] == 'admin'

    # Logout
    client.post('/api/auth/logout')
    res_me = client.get('/api/auth/me')
    assert res_me.get_json()['authenticated'] is False

def test_candidate_job_application_pipeline(client):
    # Register and login candidate
    client.post('/api/auth/register', json={
        'full_name': 'Bob Developer',
        'email': 'bob@example.com',
        'password': 'Password123!',
        'confirm_password': 'Password123!'
    })

    # Create a job opening
    job_res = client.post('/api/jobs', json={
        'title': 'Senior Python Developer',
        'department': 'Engineering',
        'location': 'Remote',
        'employment_type': 'Full-time',
        'min_experience_years': 3,
        'raw_description': 'Looking for an experienced Python developer with Flask, SQL, Docker, and REST APIs experience.'
    })
    assert job_res.status_code == 201
    job_id = job_res.get_json()['job']['id']

    # Generate a simple text-based PDF resume
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph
    from reportlab.lib.styles import getSampleStyleSheet

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = [
        Paragraph("Bob Developer - bob@example.com - +1-555-0199", styles['Title']),
        Paragraph("Senior Python Developer with 5 years experience in Python, Flask, SQL, and Docker.", styles['Normal']),
        Paragraph("Skills: Python, Flask, SQL, Docker, Git, REST API", styles['Normal']),
        Paragraph("Experience: 2019 - Present at Tech Co as Backend Engineer", styles['Normal']),
        Paragraph("Education: Bachelor of Science in Computer Science", styles['Normal'])
    ]
    doc.build(story)
    pdf_bytes = buffer.getvalue()

    # Candidate submits application
    apply_res = client.post('/api/applications/apply', data={
        'job_id': str(job_id),
        'full_name': 'Bob Developer',
        'email': 'bob@example.com',
        'phone': '+1-555-0199',
        'location': 'Remote',
        'cover_letter': 'I am excited to apply for this Python role.',
        'file': (io.BytesIO(pdf_bytes), 'bob_resume.pdf')
    }, content_type='multipart/form-data')

    assert apply_res.status_code == 201
    app_data = apply_res.get_json()['application']
    app_id = app_data['id']
    assert app_data['status'] == 'Applied'
    assert app_data['match_score'] > 50  # Matches Python, Flask, SQL, Docker, Experience

    # Test Duplicate Application Protection
    dup_res = client.post('/api/applications/apply', data={
        'job_id': str(job_id),
        'full_name': 'Bob Developer',
        'email': 'bob@example.com',
        'file': (io.BytesIO(pdf_bytes), 'bob_resume.pdf')
    }, content_type='multipart/form-data')
    assert dup_res.status_code == 409
    assert dup_res.get_json()['is_duplicate'] is True

    # Candidate views "My Applications"
    my_apps = client.get('/api/applications/my')
    assert my_apps.status_code == 200
    apps_list = my_apps.get_json()['applications']
    assert len(apps_list) == 1
    assert apps_list[0]['id'] == app_id

    # Candidate views application details
    cand_view = client.get(f'/api/applications/{app_id}')
    assert cand_view.status_code == 200
    assert 'notes' not in cand_view.get_json()  # Internal notes hidden from candidate!

    # Switch to Admin
    client.post('/api/auth/login', json={
        'email': 'admin@resumescreening.com',
        'password': 'AdminPassword123!',
        'expected_role': 'admin'
    })

    # Admin lists applicants for this job
    job_apps_res = client.get(f'/api/applications/job/{job_id}')
    assert job_apps_res.status_code == 200
    assert len(job_apps_res.get_json()['applications']) == 1

    # Admin updates application status to 'Shortlisted'
    status_update = client.put(f'/api/applications/{app_id}/status', json={
        'status': 'Shortlisted',
        'note': 'Candidate meets all core requirements'
    })
    assert status_update.status_code == 200
    assert status_update.get_json()['application']['status'] == 'Shortlisted'

    # Admin adds internal recruiter note
    note_res = client.post(f'/api/applications/{app_id}/notes', json={
        'content': 'Schedule technical screening interview for next Tuesday.'
    })
    assert note_res.status_code == 201

    # Admin reviews application details with notes
    admin_view = client.get(f'/api/applications/{app_id}')
    assert admin_view.status_code == 200
    admin_json = admin_view.get_json()
    assert 'notes' in admin_json
    assert len(admin_json['notes']) == 1
    assert 'technical screening' in admin_json['notes'][0]['content']

    # Test resume download
    download_res = client.get(f'/api/applications/{app_id}/resume/download')
    assert download_res.status_code == 200
    assert len(download_res.data) > 0
