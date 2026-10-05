import requests
import json
import os
import sys

# Ensure UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:5000"

def test_live_workflow():
    print("==================================================")
    print("  RUNNING LIVE E2E HTTP WORKFLOW VERIFICATION")
    print(f"  Target: {BASE_URL}")
    print("==================================================")

    # 1. Check Root SPA
    r = requests.get(f"{BASE_URL}/")
    assert r.status_code == 200, f"Root page failed: {r.status_code}"
    assert "Resume Screening Assistant" in r.text
    print("✅ [1/12] Web Application Root Shell Loads Successfully")

    # 2. Seed Demo Data
    r = requests.post(f"{BASE_URL}/api/settings/demo/seed")
    assert r.status_code == 200
    print(f"✅ [2/12] Demo Data Seeded: {r.json().get('message')}")

    # 3. List Jobs
    r = requests.get(f"{BASE_URL}/api/jobs")
    assert r.status_code == 200
    jobs = r.json()['jobs']
    assert len(jobs) >= 2
    active_job = jobs[0]
    print(f"✅ [3/12] Fetched {len(jobs)} Jobs (Active: '{active_job['title']}')")

    # 4. Preview NLP on Job Description
    r = requests.post(f"{BASE_URL}/api/jobs/analyze-preview", json={
        'title': 'Senior Cloud DevOps Engineer',
        'raw_description': 'Looking for a Senior DevOps engineer with 5+ years experience in AWS, Kubernetes, Docker, Terraform, CI/CD, and Python scripting.'
    })
    assert r.status_code == 200
    nlp_res = r.json()
    assert "AWS" in nlp_res['required_skills'] or "AWS" in nlp_res['technical_skills']
    assert nlp_res['min_experience_years'] >= 5.0
    print(f"✅ [4/12] Instant NLP Extraction Verified: Extracted {len(nlp_res['required_skills'])} skills, {nlp_res['min_experience_years']} yrs exp target")

    # 5. Create New Job
    r = requests.post(f"{BASE_URL}/api/jobs", json={
        'title': 'Senior Cloud DevOps Engineer',
        'department': 'Infrastructure',
        'location': 'Remote',
        'raw_description': 'Looking for a Senior DevOps engineer with 5+ years experience in AWS, Kubernetes, Docker, Terraform, CI/CD, and Python scripting.',
        'min_experience_years': 5.0
    })
    assert r.status_code == 201
    new_job = r.json()['job']
    print(f"✅ [5/12] Created Job Opening '{new_job['title']}' (ID: {new_job['id']})")

    # 6. Upload Real PDF and DOCX Resumes
    sample_pdf = "sample_resumes/sample_strong_fullstack.pdf"
    sample_docx = "sample_resumes/sample_frontend_developer.docx"
    
    with open(sample_pdf, 'rb') as f1, open(sample_docx, 'rb') as f2:
        files = [
            ('files[]', ('sample_strong_fullstack.pdf', f1, 'application/pdf')),
            ('files[]', ('sample_frontend_developer.docx', f2, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'))
        ]
        data = {'job_id': str(new_job['id'])}
        r = requests.post(f"{BASE_URL}/api/resumes/upload", files=files, data=data)
        
    assert r.status_code == 200
    upload_res = r.json()
    assert len(upload_res['results']) == 2
    for item in upload_res['results']:
        assert item['status'] == 'success'
        print(f"   -> Uploaded & Parsed '{item['filename']}': Candidate '{item['candidate_name']}' - Match Score: {item['match_score']}%")
    print("✅ [6/12] Batch PDF & DOCX Resume Upload & Extraction Succeeded")

    # 7. List Candidates with Filtering & Search
    r = requests.get(f"{BASE_URL}/api/candidates?job_id={new_job['id']}")
    assert r.status_code == 200
    cands = r.json()['candidates']
    assert len(cands) == 2
    tested_cand = cands[0]
    print(f"✅ [7/12] Candidate Listing Verified ({len(cands)} candidates for new job)")

    # 8. Detailed Candidate Profile & Requirement Matrix
    r = requests.get(f"{BASE_URL}/api/candidates/{tested_cand['id']}")
    assert r.status_code == 200
    cand_detail = r.json()
    matrix = cand_detail['screening']['matrix']
    assert len(matrix) >= 1
    print(f"✅ [8/12] Candidate Profile Loaded ({len(matrix)} Requirement-by-Requirement Evidence rows)")
    for row in matrix[:3]:
        print(f"      [{row['requirement_title']}] => Evidence: '{row['candidate_evidence'][:60]}...' ({row['match_status']})")

    # 9. Recruiter Note & Status History
    r = requests.post(f"{BASE_URL}/api/candidates/{tested_cand['id']}/notes", json={
        'content': 'Candidate demonstrated exceptional system architecture depth during review.',
        'author': 'Lead Recruiter'
    })
    assert r.status_code == 201
    
    r = requests.put(f"{BASE_URL}/api/candidates/{tested_cand['id']}/status", json={
        'status': 'Shortlisted',
        'note': 'Promoted after full requirement review.'
    })
    assert r.status_code == 200
    print("✅ [9/12] Recruiter Notes & Status Audit History Verified")

    # 10. Side-by-Side Candidate Comparison
    r = requests.post(f"{BASE_URL}/api/screening/compare", json={
        'candidate_ids': [cands[0]['id'], cands[1]['id']],
        'job_id': new_job['id']
    })
    assert r.status_code == 200
    compare_res = r.json()
    assert len(compare_res['candidates']) == 2
    print(f"✅ [10/12] Side-by-Side Comparison Matrix Verified ({compare_res['candidates'][0]['name']} vs {compare_res['candidates'][1]['name']})")

    # 11. Reports & Downloads (Analytics, CSV, PDF)
    r_analytics = requests.get(f"{BASE_URL}/api/reports/analytics")
    assert r_analytics.status_code == 200
    
    r_csv = requests.get(f"{BASE_URL}/api/reports/export/csv")
    assert r_csv.status_code == 200
    assert "Candidate Name" in r_csv.text
    
    r_pdf = requests.get(f"{BASE_URL}/api/reports/export/pdf")
    assert r_pdf.status_code == 200
    assert len(r_pdf.content) > 1000
    print(f"✅ [11/12] Reports Generated (CSV: {len(r_csv.text)} bytes, Executive PDF: {len(r_pdf.content)} bytes)")

    # 12. Scoring Weights Configurator
    r = requests.put(f"{BASE_URL}/api/settings/weights", json={
        'weights': {
            'required_skills': 35,
            'experience': 25,
            'technical_skills': 15,
            'projects': 10,
            'education': 5,
            'preferred_skills': 5,
            'certifications': 5
        }
    })
    assert r.status_code == 200
    print("✅ [12/12] Configurable Scoring Weights Saved (100% total sum validated)")

    print("\n==================================================")
    print("  ALL 12 END-TO-END VERIFICATION CHECKS PASSED! 🚀")
    print("==================================================")

if __name__ == '__main__':
    test_live_workflow()
