import json
from datetime import datetime, timedelta, timezone
from backend.app.database import db
from backend.app.models import (
    User, Job, JobRequirement, Candidate, Application, Resume, CandidateSkill,
    Experience, Education, Project, Certification, ScreeningResult,
    RequirementMatch, CandidateNote, StatusHistory, ActivityLog
)
from backend.app.screening.matcher import match_candidate_to_job
from backend.app.parsers.job_analyzer import analyze_job_description

def seed_demo_data():
    """
    Populates rich, realistic demo jobs, candidate user, and applications for demonstration.
    """
    # Check if demo data already exists
    if Job.query.filter_by(is_demo=True).first():
        return {"message": "Demo data already loaded.", "status": "exists"}
        
    now = datetime.now(timezone.utc)
    
    # Ensure demo candidate user exists
    demo_candidate_user = User.query.filter_by(email='candidate@example.com').first()
    if not demo_candidate_user:
        demo_candidate_user = User(
            email='candidate@example.com',
            full_name='Alex Rivera',
            role='candidate',
            phone='555-0143',
            location='Austin, TX'
        )
        demo_candidate_user.set_password('CandidatePassword123!')
        db.session.add(demo_candidate_user)
        db.session.flush()
    
    # 1. Demo Jobs
    job1_desc = """
We are seeking an experienced Senior Full-Stack Python Developer to lead the architecture and development of our cloud SaaS products.
You will build performant RESTful APIs, scalable microservices, and modern frontend interfaces.

Required Qualifications:
- 4+ years of professional software engineering experience with Python
- Strong expertise with Flask, FastAPI, or Django
- Proficiency with SQL (PostgreSQL), Redis, and database performance tuning
- Experience building and consuming REST APIs
- Familiarity with Docker and containerization

Preferred Qualifications:
- Experience with React or modern TypeScript frontend frameworks
- AWS or Cloud deployment experience (ECS, Lambda, S3)
- Familiarity with CI/CD pipelines (GitHub Actions)
- Strong unit testing practices (pytest)

Responsibilities:
- Architect, build, and deploy robust web services and data pipelines
- Collaborate with product designers and frontend engineers to deliver intuitive features
- Conduct code reviews and mentor junior team members
- Ensure high test coverage and system reliability
    """
    
    analysis1 = analyze_job_description("Senior Full-Stack Python Engineer", job1_desc)
    
    job1 = Job(
        title="Senior Full-Stack Python Engineer",
        department="Engineering",
        location="Remote (US / Canada)",
        employment_type="Full-time",
        min_experience_years=4.0,
        education_level="Bachelor's Degree",
        salary_range="$135,000 - $165,000",
        status="Active",
        raw_description=job1_desc.strip(),
        responsibilities_text="Architect, build, and deploy robust web services and data pipelines.\nCollaborate with product designers and frontend engineers.\nConduct code reviews and ensure test coverage.",
        qualifications_text="4+ years Python development, Flask/FastAPI/Django, PostgreSQL, REST APIs, Docker.",
        required_skills=json.dumps(analysis1['required_skills']),
        preferred_skills=json.dumps(analysis1['preferred_skills']),
        extracted_keywords=json.dumps(analysis1['keywords']),
        extracted_data_json=json.dumps(analysis1),
        is_demo=True,
        created_at=now - timedelta(days=5)
    )
    db.session.add(job1)
    db.session.flush()
    
    # Requirements for Job 1
    for req in analysis1['required_skills']:
        db.session.add(JobRequirement(
            job_id=job1.id,
            category='required_skill',
            title=req,
            description=f"Demonstrated proficiency in {req}",
            weight=1.0
        ))
    db.session.add(JobRequirement(
        job_id=job1.id,
        category='experience',
        title="4+ Years Software Experience",
        description="Minimum 4 years professional development experience",
        weight=1.0
    ))
    
    # Job 2: Senior React Frontend Developer
    job2_desc = """
Join our rapid-growth product team as a Senior Frontend Developer building high-performance web applications in React and TypeScript.

Requirements:
- 3+ years experience with React, JavaScript (ES6+), and TypeScript
- Modern CSS, Tailwind CSS, and responsive component design
- Experience with Next.js, Redux or React Query, and REST API integration
- Automated UI testing with Jest or Cypress
- Git and agile workflow proficiency
    """
    analysis2 = analyze_job_description("Senior Frontend React Developer", job2_desc)
    job2 = Job(
        title="Senior Frontend React Developer",
        department="Product Design",
        location="San Francisco, CA / Hybrid",
        employment_type="Full-time",
        min_experience_years=3.0,
        education_level="Bachelor's Degree",
        salary_range="$130,000 - $155,000",
        status="Active",
        raw_description=job2_desc.strip(),
        responsibilities_text="Build reactive UI components, integrate GraphQL/REST APIs, optimize rendering performance.",
        qualifications_text="3+ years React & TypeScript, Next.js, Tailwind CSS, Jest.",
        required_skills=json.dumps(analysis2['required_skills']),
        preferred_skills=json.dumps(analysis2['preferred_skills']),
        extracted_keywords=json.dumps(analysis2['keywords']),
        extracted_data_json=json.dumps(analysis2),
        is_demo=True,
        created_at=now - timedelta(days=3)
    )
    db.session.add(job2)
    db.session.flush()

    # 2. Demo Candidates for Job 1
    # Candidate A: Strong Match (Alex Rivera - 88%)
    c1 = Candidate(
        job_id=job1.id,
        full_name="Alex Rivera",
        email="alex.rivera.dev@gmail.com",
        phone="+1 (415) 892-3401",
        location="Austin, TX",
        linkedin_url="https://linkedin.com/in/alexrivera-dev",
        github_url="https://github.com/alexrivera",
        portfolio_url="https://alexrivera.dev",
        professional_summary="Senior Software Engineer with 5+ years of hands-on expertise architecting high-scale backend APIs in Python (Flask/FastAPI), designing PostgreSQL data models, and orchestrating containerized microservices in Docker and AWS.",
        total_experience_years=5.2,
        highest_education="Bachelor of Science in Computer Science",
        status="Shortlisted",
        is_demo=True,
        created_at=now - timedelta(days=2)
    )
    db.session.add(c1)
    db.session.flush()
    
    # Candidate 1 Resume
    c1_resume_text = f"""
Alex Rivera
Austin, TX | alex.rivera.dev@gmail.com | +1 (415) 892-3401 | github.com/alexrivera | linkedin.com/in/alexrivera-dev

PROFESSIONAL SUMMARY
Senior Software Engineer with 5+ years of experience specializing in Python backend architecture, REST APIs, PostgreSQL, Redis, Docker, and AWS cloud infrastructure. Passionate about clean code, test-driven development with pytest, and agile delivery.

TECHNICAL SKILLS
Languages & Frameworks: Python, Flask, FastAPI, Django, JavaScript, TypeScript, React, SQL
Databases & Cloud: PostgreSQL, MySQL, Redis, Docker, Kubernetes, AWS (ECS, S3, Lambda), Git, CI/CD, GitHub Actions, Nginx, Linux
Testing & Practices: Pytest, REST APIs, Microservices, Agile, Scrum

WORK EXPERIENCE
Senior Backend Engineer | CloudScale Tech (2021 - Present)
• Architected core REST APIs in Python using FastAPI and PostgreSQL handling 50M+ monthly requests.
• Implemented distributed caching layer with Redis, slashing response latencies by 42%.
• Containerized legacy backend services with Docker and deployed automated CI/CD pipelines via GitHub Actions.
• Mentored 4 junior software engineers and conducted regular code reviews.

Software Developer | DataSync Solutions (2019 - 2021)
• Developed Python Flask microservices and integrated PostgreSQL databases with SQLAlchemy ORM.
• Designed automated test suites using pytest, achieving 94% test coverage.
• Deployed scalable applications to AWS cloud infrastructure.

EDUCATION
Bachelor of Science in Computer Science | University of Texas at Austin (2015 - 2019)
GPA: 3.8 / 4.0

KEY PROJECTS
• MicroSaaS Billing Engine: Built automated Stripe payment integration in Python FastAPI and React.
• Cloud Log Ingestion Service: High-throughput log parser using Redis Streams and Docker.

CERTIFICATIONS
• AWS Certified Solutions Architect - Associate (2022)
    """
    
    r1 = Resume(
        candidate_id=c1.id,
        filename="Alex_Rivera_Senior_Python.pdf",
        file_path="uploads/demo_alex_rivera.pdf",
        file_type="pdf",
        file_size_bytes=142850,
        file_hash="demo_hash_alex_rivera",
        raw_text=c1_resume_text.strip(),
        parsing_status="success",
        created_at=now - timedelta(days=2)
    )
    db.session.add(r1)
    
    for s_name, cat in [("Python", "technical"), ("Flask", "technical"), ("FastAPI", "technical"), ("Django", "technical"),
                        ("PostgreSQL", "technical"), ("Redis", "technical"), ("Docker", "technical"), ("AWS", "technical"),
                        ("REST APIs", "technical"), ("Pytest", "technical"), ("React", "technical"), ("Git", "technical"),
                        ("Leadership", "soft"), ("Agile", "soft"), ("Problem Solving", "soft")]:
        db.session.add(CandidateSkill(candidate_id=c1.id, name=s_name, category=cat))
        
    db.session.add(Experience(
        candidate_id=c1.id,
        job_title="Senior Backend Engineer",
        company_name="CloudScale Tech",
        location="Austin, TX",
        start_date="2021",
        end_date="Present",
        is_current=True,
        description="Architected core REST APIs in Python using FastAPI and PostgreSQL. Implemented Redis caching."
    ))
    db.session.add(Experience(
        candidate_id=c1.id,
        job_title="Software Developer",
        company_name="DataSync Solutions",
        location="Austin, TX",
        start_date="2019",
        end_date="2021",
        is_current=False,
        description="Developed Python Flask microservices and automated pytest suites."
    ))
    db.session.add(Education(
        candidate_id=c1.id,
        degree="Bachelor of Science in Computer Science",
        field_of_study="Computer Science",
        institution="University of Texas at Austin",
        graduation_year="2019",
        grade_or_gpa="3.8 GPA"
    ))
    db.session.add(Project(
        candidate_id=c1.id,
        title="MicroSaaS Billing Engine",
        description="High-scale billing service with FastAPI, Redis, and React frontend.",
        technologies="Python, FastAPI, Redis, React, Docker"
    ))
    db.session.add(Certification(
        candidate_id=c1.id,
        name="AWS Certified Solutions Architect",
        issuing_organization="Amazon Web Services",
        issue_date="2022"
    ))
    db.session.add(CandidateNote(
        candidate_id=c1.id,
        author="Recruiter Sarah",
        content="Strong technical background. Recommended for Stage 1 Technical Phone Interview.",
        created_at=now - timedelta(days=1)
    ))
    db.session.add(StatusHistory(
        candidate_id=c1.id,
        old_status="New",
        new_status="Shortlisted",
        changed_by="Recruiter Sarah",
        note="Candidate meets all key requirements.",
        created_at=now - timedelta(days=1)
    ))
    
    # Candidate B: Moderate Match (Samantha Chen - 72%)
    c2 = Candidate(
        job_id=job1.id,
        full_name="Samantha Chen",
        email="samantha.chen@outlook.com",
        phone="+1 (206) 555-0182",
        location="Seattle, WA",
        linkedin_url="https://linkedin.com/in/samanthachen",
        github_url="https://github.com/samchen-dev",
        portfolio_url="",
        professional_summary="Backend Software Developer with 2.5 years of experience developing Python web APIs, SQL databases, and cloud-hosted data processing scripts.",
        total_experience_years=2.5,
        highest_education="Bachelor of Science in Information Technology",
        status="Review Later",
        is_demo=True,
        created_at=now - timedelta(days=2)
    )
    db.session.add(c2)
    db.session.flush()
    
    c2_resume_text = f"""
Samantha Chen
Seattle, WA | samantha.chen@outlook.com | +1 (206) 555-0182 | github.com/samchen-dev

SUMMARY
Backend Developer with 2.5 years of experience building Python and Django applications, relational databases with MySQL/PostgreSQL, and REST APIs.

SKILLS
Python, Django, Flask, PostgreSQL, MySQL, REST APIs, Git, HTML, CSS, JavaScript, Problem Solving

EXPERIENCE
Software Engineer | NexaCorp (2022 - Present)
• Built internal CRUD portals and Django REST API endpoints for customer analytics.
• Optimized PostgreSQL queries and database schemas.
• Participated in bi-weekly agile sprints and sprint planning.

Junior Developer | WebLabs (2021 - 2022)
• Maintained Python scripts and SQL report queries.

EDUCATION
Bachelor of Science in Information Technology | University of Washington (2021)
    """
    
    r2 = Resume(
        candidate_id=c2.id,
        filename="Samantha_Chen_Resume.pdf",
        file_path="uploads/demo_samantha_chen.pdf",
        file_type="pdf",
        file_size_bytes=98400,
        file_hash="demo_hash_samantha_chen",
        raw_text=c2_resume_text.strip(),
        parsing_status="success",
        created_at=now - timedelta(days=2)
    )
    db.session.add(r2)
    
    for s_name, cat in [("Python", "technical"), ("Django", "technical"), ("Flask", "technical"),
                        ("PostgreSQL", "technical"), ("MySQL", "technical"), ("REST APIs", "technical"),
                        ("Git", "technical"), ("Agile", "soft"), ("Problem Solving", "soft")]:
        db.session.add(CandidateSkill(candidate_id=c2.id, name=s_name, category=cat))
        
    db.session.add(Experience(
        candidate_id=c2.id,
        job_title="Software Engineer",
        company_name="NexaCorp",
        location="Seattle, WA",
        start_date="2022",
        end_date="Present",
        is_current=True,
        description="Built internal CRUD portals and Django REST API endpoints for customer analytics."
    ))
    db.session.add(Education(
        candidate_id=c2.id,
        degree="Bachelor of Science in Information Technology",
        field_of_study="Information Technology",
        institution="University of Washington",
        graduation_year="2021",
        grade_or_gpa="3.5 GPA"
    ))
    
    # Candidate C: Junior / Below Target Experience (Marcus Vance - 52%)
    c3 = Candidate(
        job_id=job1.id,
        full_name="Marcus Vance",
        email="m.vance99@gmail.com",
        phone="+1 (312) 440-1928",
        location="Chicago, IL",
        linkedin_url="https://linkedin.com/in/marcusvance",
        github_url="https://github.com/marcusvance",
        portfolio_url="",
        professional_summary="Recent Computer Science graduate with internship experience developing Python automation tools, basic web pages in HTML/CSS, and SQLite databases.",
        total_experience_years=1.0,
        highest_education="Bachelor of Science in Computer Science",
        status="Screening",
        is_demo=True,
        created_at=now - timedelta(days=1)
    )
    db.session.add(c3)
    db.session.flush()
    
    c3_resume_text = f"""
Marcus Vance
Chicago, IL | m.vance99@gmail.com | +1 (312) 440-1928

SUMMARY
Entry-level software engineer with Python academic foundation, data structures knowledge, and collaborative team mindset.

SKILLS
Python, JavaScript, HTML, CSS, SQLite, Git, Teamwork

EXPERIENCE
Software Intern | ByteTech (2023 - 2024)
• Assisted engineering team with Python unit tests and bug fixes.
• Created web forms in HTML and JavaScript.

EDUCATION
Bachelor of Science in Computer Science | DePaul University (2023)
    """
    
    r3 = Resume(
        candidate_id=c3.id,
        filename="Marcus_Vance_Junior.pdf",
        file_path="uploads/demo_marcus_vance.pdf",
        file_type="pdf",
        file_size_bytes=81200,
        file_hash="demo_hash_marcus_vance",
        raw_text=c3_resume_text.strip(),
        parsing_status="success",
        created_at=now - timedelta(days=1)
    )
    db.session.add(r3)
    for s_name, cat in [("Python", "technical"), ("JavaScript", "technical"), ("SQLite", "technical"), ("Git", "technical"), ("Teamwork", "soft")]:
        db.session.add(CandidateSkill(candidate_id=c3.id, name=s_name, category=cat))
    db.session.add(Experience(
        candidate_id=c3.id,
        job_title="Software Intern",
        company_name="ByteTech",
        location="Chicago, IL",
        start_date="2023",
        end_date="2024",
        is_current=False,
        description="Assisted engineering team with Python unit tests and bug fixes."
    ))
    db.session.add(Education(
        candidate_id=c3.id,
        degree="Bachelor of Science in Computer Science",
        field_of_study="Computer Science",
        institution="DePaul University",
        graduation_year="2023"
    ))
    
    # Calculate screening results & create applications for all candidates
    db.session.commit()
    
    for cand, target_job in [(c1, job1), (c2, job1), (c3, job1)]:
        match_data = match_candidate_to_job(cand, target_job)
        
        # Create Application record
        app_status = cand.status if cand.status else 'Applied'
        app = Application(
            job_id=target_job.id,
            user_id=demo_candidate_user.id if cand == c1 else None,
            candidate_id=cand.id,
            resume_id=cand.resume.id if cand.resume else None,
            status=app_status,
            match_score=match_data['overall_match_score'],
            cover_letter=f"Excited to apply for the {target_job.title} position!",
            created_at=now - timedelta(days=2)
        )
        db.session.add(app)
        db.session.flush()
        
        if cand.resume:
            cand.resume.application_id = app.id
            
        sr = ScreeningResult(
            application_id=app.id,
            job_id=target_job.id,
            candidate_id=cand.id,
            overall_match_score=match_data['overall_match_score'],
            required_skills_score=match_data['sub_scores']['required_skills'],
            preferred_skills_score=match_data['sub_scores']['preferred_skills'],
            experience_score=match_data['sub_scores']['experience'],
            technical_skills_score=match_data['sub_scores']['technical_skills'],
            projects_score=match_data['sub_scores']['projects'],
            education_score=match_data['sub_scores']['education'],
            certifications_score=match_data['sub_scores']['certifications'],
            matched_requirements_json=json.dumps(match_data['matched_requirements']),
            partial_requirements_json=json.dumps(match_data['partial_requirements']),
            missing_requirements_json=json.dumps(match_data['missing_requirements']),
            potential_concerns_json=json.dumps(match_data['potential_concerns']),
            summary_explanation=match_data['summary_explanation'],
            verification_tips=match_data['verification_tips'],
            ai_interview_questions_json=json.dumps(match_data['interview_questions']),
            weights_used_json=json.dumps(match_data['weights_used']),
            screened_at=now - timedelta(hours=12)
        )
        db.session.add(sr)
        db.session.flush()
        
        for m in match_data['matrix']:
            db.session.add(RequirementMatch(
                screening_result_id=sr.id,
                requirement_title=m['requirement_title'],
                requirement_type=m['requirement_type'],
                match_status=m['match_status'],
                candidate_evidence=m['candidate_evidence'],
                relevance_score=m['relevance_score']
            ))
            
        # Initial status history
        db.session.add(StatusHistory(
            candidate_id=cand.id,
            application_id=app.id,
            old_status=None,
            new_status=app_status,
            changed_by='Lead Recruiter' if app_status != 'Applied' else cand.full_name,
            note='Initial screening completed'
        ))

    # Activity Logs
    db.session.add(ActivityLog(
        event_type="job_created",
        description="Created job position 'Senior Full-Stack Python Engineer'",
        entity_type="job",
        entity_id=job1.id,
        created_at=now - timedelta(days=5)
    ))
    db.session.add(ActivityLog(
        event_type="application_submitted",
        description="Application submitted by Alex Rivera for 'Senior Full-Stack Python Engineer'",
        entity_type="application",
        entity_id=c1.id,
        created_at=now - timedelta(days=2)
    ))
    db.session.add(ActivityLog(
        event_type="status_changed",
        description="Shortlisted applicant Alex Rivera for 'Senior Full-Stack Python Engineer'",
        entity_type="application",
        entity_id=c1.id,
        created_at=now - timedelta(days=1)
    ))

    db.session.commit()
    return {"message": "Demo data populated successfully!", "status": "success"}

def clear_demo_data():
    """
    Cleans up all demo records without modifying real user records.
    """
    demo_jobs = Job.query.filter_by(is_demo=True).all()
    demo_cands = Candidate.query.filter_by(is_demo=True).all()
    demo_job_ids = [j.id for j in demo_jobs]
    demo_cand_ids = [c.id for c in demo_cands]
    
    if demo_job_ids or demo_cand_ids:
        demo_apps = Application.query.filter(
            (Application.job_id.in_(demo_job_ids)) | (Application.candidate_id.in_(demo_cand_ids))
        ).all()
        for a in demo_apps:
            db.session.delete(a)
            
    for c in demo_cands:
        db.session.delete(c)
    for j in demo_jobs:
        db.session.delete(j)
        
    db.session.commit()
    return {"message": "Demo data cleared successfully.", "status": "success"}
