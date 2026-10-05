import io
import requests
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet

BASE_URL = "http://127.0.0.1:5000"

def run_live_verification():
    print("==================================================")
    print("STARTING LIVE SERVER FULL WORKFLOW VERIFICATION")
    print("==================================================")
    
    # 1. Verify Home Page HTML & Static Assets
    print("\n[Step 1] Verifying Home Page & Static Assets...")
    res_home = requests.get(f"{BASE_URL}/")
    assert res_home.status_code == 200
    assert "Resume Screening Assistant" in res_home.text
    assert "app-sidebar" in res_home.text or "guest-navbar" in res_home.text
    print(" [PASS] Home page HTML returned successfully (HTTP 200).")

    res_css = requests.get(f"{BASE_URL}/static/css/components.css")
    assert res_css.status_code == 200
    print(" [PASS] Static CSS loaded successfully (HTTP 200).")

    res_js = requests.get(f"{BASE_URL}/static/js/app.js")
    assert res_js.status_code == 200
    print(" [PASS] Static JS loaded successfully (HTTP 200).")

    # 2. Candidate Registration Flow
    print("\n[Step 2] Testing Candidate Registration...")
    session_cand = requests.Session()
    
    # Validation test: mismatched password
    bad_reg = session_cand.post(f"{BASE_URL}/api/auth/register", json={
        "full_name": "Sarah Connor",
        "email": "sarah.connor@testrecruit.com",
        "password": "Password123!",
        "confirm_password": "WrongPassword!"
    })
    assert bad_reg.status_code == 400
    print(" [PASS] Password mismatch properly rejected.")

    # Successful registration
    reg_res = session_cand.post(f"{BASE_URL}/api/auth/register", json={
        "full_name": "Sarah Connor",
        "email": "sarah.connor@testrecruit.com",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "phone": "+1 555-0144",
        "location": "Los Angeles, CA"
    })
    # If already exists in DB from prior run, login instead
    if reg_res.status_code == 409:
        login_res = session_cand.post(f"{BASE_URL}/api/auth/login", json={
            "email": "sarah.connor@testrecruit.com",
            "password": "Password123!",
            "expected_role": "candidate"
        })
        assert login_res.status_code == 200
        print(" [PASS] Existing Candidate logged in successfully.")
    else:
        assert reg_res.status_code == 201
        print(" [PASS] New Candidate registered & authenticated successfully.")

    me_cand = session_cand.get(f"{BASE_URL}/api/auth/me")
    assert me_cand.status_code == 200
    assert me_cand.json()["authenticated"] is True
    assert me_cand.json()["user"]["role"] == "candidate"
    print(f" [PASS] Candidate session verified: {me_cand.json()['user']['full_name']} ({me_cand.json()['user']['email']})")

    # 3. Admin Authentication & Job Creation Flow
    print("\n[Step 3] Testing Admin Login & Job Creation...")
    session_admin = requests.Session()
    admin_login = session_admin.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@resumescreening.com",
        "password": "AdminPassword123!",
        "expected_role": "admin"
    })
    assert admin_login.status_code == 200
    assert admin_login.json()["user"]["role"] == "admin"
    print(" [PASS] Admin successfully logged in.")

    # Create Job Position
    create_job_res = session_admin.post(f"{BASE_URL}/api/jobs", json={
        "title": "Lead Cloud Infrastructure Engineer",
        "department": "Infrastructure & Platform",
        "location": "Remote / Austin, TX",
        "employment_type": "Full-time",
        "min_experience_years": 4.0,
        "salary_range": "$140,000 - $175,000",
        "raw_description": "We are seeking a Lead Cloud Engineer experienced with Kubernetes, Terraform, AWS, Docker, Python, CI/CD pipelines, and Linux system administration.",
        "status": "Active"
    })
    if create_job_res.status_code not in [201, 200]:
        print(f"Failed to create job: Status {create_job_res.status_code}, Body: {create_job_res.text}")
    assert create_job_res.status_code in [201, 200]
    job_id = create_job_res.json()["job"]["id"]
    print(f" [PASS] Job created: '{create_job_res.json()['job']['title']}' (Job ID: {job_id})")

    # 4. Candidate Browses Jobs & Applies with Resume
    print("\n[Step 4] Candidate Browses Jobs & Submits Application...")
    jobs_list = session_cand.get(f"{BASE_URL}/api/jobs").json()["jobs"]
    assert any(j["id"] == job_id for j in jobs_list)
    print(f" [PASS] Verified job listing appears in candidate feed ({len(jobs_list)} active jobs).")

    # Generate Candidate Resume Document
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = [
        Paragraph("Sarah Connor - Cloud Infrastructure Specialist", styles['Title']),
        Paragraph("Email: sarah.connor@testrecruit.com | Phone: +1 555-0144 | Location: Los Angeles, CA", styles['Normal']),
        Paragraph("Summary: 6 years experience in Cloud Infrastructure, Kubernetes orchestration, Terraform IaC, AWS cloud architectures, Docker containerization, Python scripting, and automated CI/CD pipelines.", styles['Normal']),
        Paragraph("Core Skills: Kubernetes, Terraform, AWS, Docker, Python, CI/CD, Linux, Git, Prometheus", styles['Normal']),
        Paragraph("Experience: 2020 - Present at CloudTech Inc as Senior DevOps / Cloud Engineer. Automated cloud deployments and maintained 99.99% infrastructure uptime.", styles['Normal']),
        Paragraph("Education: Bachelor of Science in Computer Systems Engineering", styles['Normal']),
        Paragraph("Certifications: AWS Certified Solutions Architect Professional, Certified Kubernetes Administrator (CKA)", styles['Normal'])
    ]
    doc.build(story)
    resume_pdf_bytes = buffer.getvalue()

    # Submit Application
    apply_res = session_cand.post(
        f"{BASE_URL}/api/applications/apply",
        data={
            "job_id": str(job_id),
            "full_name": "Sarah Connor",
            "email": "sarah.connor@testrecruit.com",
            "phone": "+1 555-0144",
            "location": "Los Angeles, CA",
            "cover_letter": "I have extensive production experience scaling Kubernetes clusters and managing Terraform configurations."
        },
        files={
            "file": ("sarah_connor_cloud_resume.pdf", resume_pdf_bytes, "application/pdf")
        }
    )
    assert apply_res.status_code == 201
    app_info = apply_res.json()["application"]
    app_id = app_info["id"]
    match_score = app_info["match_score"]
    print(f" [PASS] Application submitted successfully (App ID: {app_id}, Match Score: {match_score}%).")
    assert match_score >= 70, f"Expected strong match for qualified candidate, got {match_score}%"

    # 5. Duplicate Application Protection Check
    print("\n[Step 5] Verifying Duplicate Application Protection...")
    dup_res = session_cand.post(
        f"{BASE_URL}/api/applications/apply",
        data={
            "job_id": str(job_id),
            "full_name": "Sarah Connor",
            "email": "sarah.connor@testrecruit.com"
        },
        files={
            "file": ("sarah_connor_cloud_resume.pdf", resume_pdf_bytes, "application/pdf")
        }
    )
    assert dup_res.status_code == 409
    assert dup_res.json()["is_duplicate"] is True
    print(" [PASS] Duplicate application prevented (HTTP 409 Conflict returned with friendly notice).")

    # 6. Candidate Views "My Applications"
    print("\n[Step 6] Verifying Candidate 'My Applications' Page...")
    my_apps = session_cand.get(f"{BASE_URL}/api/applications/my").json()["applications"]
    assert any(a["id"] == app_id for a in my_apps)
    print(f" [PASS] Candidate successfully retrieved applications list ({len(my_apps)} applications).")

    app_detail = session_cand.get(f"{BASE_URL}/api/applications/{app_id}").json()
    assert "notes" not in app_detail, "Security error: Internal admin notes exposed to candidate!"
    print(" [PASS] Candidate application details loaded (Internal recruiter notes properly hidden).")

    # 7. Admin Reviews Candidate Application & Screening Matrix
    print("\n[Step 7] Admin Reviews Applicant & Requirement Match Evidence...")
    admin_app = session_admin.get(f"{BASE_URL}/api/applications/{app_id}").json()
    assert admin_app["id"] == app_id
    assert "notes" in admin_app, "Admin should have access to internal notes"
    assert "screening" in admin_app
    print(f" [PASS] Admin loaded applicant review: {admin_app['candidate_name']} - {admin_app['match_score']}% Match.")

    # 8. Admin Updates Status to 'Shortlisted' & Adds Internal Recruiter Note
    print("\n[Step 8] Admin Updates Status & Adds Recruiter Note...")
    status_res = session_admin.put(
        f"{BASE_URL}/api/applications/{app_id}/status",
        json={"status": "Shortlisted", "note": "Strong Kubernetes & Terraform alignment. Top candidate."}
    )
    assert status_res.status_code == 200
    assert status_res.json()["application"]["status"] == "Shortlisted"
    print(" [PASS] Application status updated to 'Shortlisted'.")

    note_res = session_admin.post(
        f"{BASE_URL}/api/applications/{app_id}/notes",
        json={"content": "Scheduled round 1 architecture interview for Thursday 2:00 PM."}
    )
    assert note_res.status_code == 201
    print(" [PASS] Internal recruiter note recorded successfully.")

    # 9. Verify Candidate Sees Updated Status but NOT Notes
    print("\n[Step 9] Verifying Candidate Status Update Reflection...")
    updated_cand_app = session_cand.get(f"{BASE_URL}/api/applications/{app_id}").json()
    assert updated_cand_app["status"] == "Shortlisted"
    assert "notes" not in updated_cand_app
    print(" [PASS] Candidate sees updated status 'Shortlisted' with zero internal note leak.")

    # 10. Admin Reports & Export
    print("\n[Step 10] Verifying Admin Reports & Settings...")
    all_apps = session_admin.get(f"{BASE_URL}/api/applications").json()
    assert all_apps["total"] >= 1
    print(f" [PASS] Admin retrieved applicant reports list ({all_apps['total']} total applications).")

    settings = session_admin.get(f"{BASE_URL}/api/settings").json()
    assert "scoring_weights" in settings or "weights" in settings
    print(f" [PASS] Admin retrieved configurable weights: {settings.get('scoring_weights') or settings.get('weights')}.")

    print("\n==================================================")
    print("ALL LIVE SERVER WORKFLOWS PASSED WITH 100% SUCCESS!")
    print("==================================================")

if __name__ == "__main__":
    run_live_verification()
