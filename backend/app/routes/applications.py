import os
import json
import uuid
from flask import Blueprint, request, jsonify, send_file, current_app
from backend.app.database import db
from backend.app.models import (
    Job, Candidate, Resume, Application, CandidateSkill, Experience,
    Education, Project, Certification, ScreeningResult, RequirementMatch,
    CandidateNote, StatusHistory, User
)
from backend.app.parsers.pdf_parser import extract_text_from_pdf
from backend.app.parsers.docx_parser import extract_text_from_docx
from backend.app.parsers.resume_extractor import parse_resume_content
from backend.app.screening.matcher import match_candidate_to_job
from backend.app.utils.file_validation import (
    validate_resume_file,
    sanitize_filename,
    compute_file_hash
)
from backend.app.utils.auth import get_current_user, login_required, admin_required
from backend.app.utils.logger import log_activity

applications_bp = Blueprint('applications', __name__, url_prefix='/api/applications')

@applications_bp.route('/apply', methods=['POST'])
def submit_application():
    """
    Submits a candidate job application:
    Links Candidate -> Job -> Resume -> Screening Result -> Application.
    Includes duplicate application protection.
    """
    current_user = get_current_user()
    
    job_id = request.form.get('job_id')
    if not job_id or not str(job_id).isdigit():
        return jsonify({'error': 'Please select a valid job opening to apply.'}), 400
        
    job = db.session.get(Job, int(job_id))
    if not job:
        return jsonify({'error': 'The requested job opening does not exist.'}), 404
        
    if job.status != 'Active':
        return jsonify({'error': f"This job position is currently {job.status.lower()} and not accepting new applications."}), 400
        
    # Candidate contact info
    full_name = request.form.get('full_name', '').strip()
    email = request.form.get('email', '').strip().lower()
    phone = request.form.get('phone', '').strip()
    location = request.form.get('location', '').strip()
    cover_letter = request.form.get('cover_letter', '').strip()
    
    if current_user:
        if not full_name:
            full_name = current_user.full_name
        if not email:
            email = current_user.email
        if not phone and current_user.phone:
            phone = current_user.phone
        if not location and current_user.location:
            location = current_user.location
            
    if not full_name:
        return jsonify({'error': 'Please provide your full name.'}), 400
    if not email:
        return jsonify({'error': 'Please provide your email address.'}), 400
        
    # Duplicate Application Protection
    # 1. Check by logged in user_id
    if current_user:
        existing_app = Application.query.filter_by(user_id=current_user.id, job_id=job.id).first()
        if existing_app:
            return jsonify({
                'error': f"You have already applied for the position '{job.title}'.",
                'is_duplicate': True,
                'application_id': existing_app.id
            }), 409
            
    # 2. Check by email for this specific job
    existing_by_email = Application.query.join(Candidate).filter(
        Application.job_id == job.id,
        Candidate.email == email
    ).first()
    if existing_by_email:
        return jsonify({
            'error': f"An application from {email} has already been submitted for this position.",
            'is_duplicate': True,
            'application_id': existing_by_email.id
        }), 409
        
    # Resume file processing
    uploaded_file = request.files.get('file') or request.files.get('resume')
    if not uploaded_file:
        return jsonify({'error': 'Please upload your resume (PDF or DOCX format).'}), 400
        
    is_valid, err_msg, ext, file_bytes = validate_resume_file(uploaded_file)
    if not is_valid:
        return jsonify({'error': err_msg or 'Invalid resume file. Please upload a valid PDF or DOCX file (up to 16MB).'}), 400
        
    upload_folder = os.path.abspath(current_app.config.get('UPLOAD_FOLDER', 'uploads'))
    os.makedirs(upload_folder, exist_ok=True)
    
    file_hash = compute_file_hash(file_bytes)
    unique_prefix = uuid.uuid4().hex[:8]
    safe_name = f"{unique_prefix}_{sanitize_filename(uploaded_file.filename)}"
    file_path = os.path.join(upload_folder, safe_name)
    
    with open(file_path, 'wb') as f:
        f.write(file_bytes)
        
    # Parse document text
    if ext == 'pdf':
        raw_text, pages, meta, parse_err = extract_text_from_pdf(file_bytes)
    elif ext == 'docx':
        raw_text, paras, meta, parse_err = extract_text_from_docx(file_bytes)
    else:
        raw_text, parse_err = "", "Unsupported file type"
        
    if parse_err or not raw_text.strip():
        return jsonify({'error': 'Unable to read text from the uploaded resume. Please check your document and try again.'}), 400
        
    parsed = parse_resume_content(raw_text)
    
    # 1. Create Candidate Profile
    candidate = Candidate(
        user_id=current_user.id if current_user else None,
        job_id=job.id,
        full_name=full_name or parsed.get('full_name', 'Applicant'),
        email=email or (parsed.get('email') if parsed.get('email') != 'Not detected' else ''),
        phone=phone or (parsed.get('phone') if parsed.get('phone') != 'Not detected' else ''),
        location=location or (parsed.get('location') if parsed.get('location') != 'Not detected' else ''),
        linkedin_url=parsed.get('linkedin_url', ''),
        github_url=parsed.get('github_url', ''),
        portfolio_url=parsed.get('portfolio_url', ''),
        professional_summary=parsed.get('professional_summary', ''),
        total_experience_years=parsed.get('total_experience_years', 0.0),
        highest_education=parsed.get('highest_education', ''),
        status='Applied',
        is_demo=False
    )
    db.session.add(candidate)
    db.session.flush()
    
    # 2. Create Resume Record
    resume = Resume(
        candidate_id=candidate.id,
        filename=uploaded_file.filename,
        file_path=file_path,
        file_type=ext,
        file_size_bytes=len(file_bytes),
        file_hash=file_hash,
        raw_text=raw_text,
        parsed_data_json=json.dumps(parsed),
        parsing_status='success'
    )
    db.session.add(resume)
    db.session.flush()
    
    # 3. Add Skills, Experience, Education, Projects, Certifications
    for sk in parsed.get('skills', []):
        db.session.add(CandidateSkill(
            candidate_id=candidate.id,
            name=sk['name'],
            category=sk.get('category', 'technical'),
            proficiency='Detected'
        ))
        
    for exp in parsed.get('experiences', []):
        db.session.add(Experience(
            candidate_id=candidate.id,
            job_title=exp.get('job_title', 'Role'),
            company_name=exp.get('company_name', 'Company'),
            location=exp.get('location', ''),
            start_date=exp.get('start_date', ''),
            end_date=exp.get('end_date', ''),
            is_current=exp.get('is_current', False),
            duration_months=exp.get('duration_months', 0),
            description=exp.get('description', '')
        ))
        
    for edu in parsed.get('education', []):
        db.session.add(Education(
            candidate_id=candidate.id,
            degree=edu.get('degree', 'Degree'),
            field_of_study=edu.get('field_of_study', ''),
            institution=edu.get('institution', 'Institution'),
            graduation_year=edu.get('graduation_year', ''),
            grade_or_gpa=edu.get('grade_or_gpa', '')
        ))
        
    for proj in parsed.get('projects', []):
        db.session.add(Project(
            candidate_id=candidate.id,
            title=proj.get('title', 'Project'),
            description=proj.get('description', ''),
            technologies=proj.get('technologies', ''),
            url=proj.get('url', '')
        ))
        
    for cert in parsed.get('certifications', []):
        db.session.add(Certification(
            candidate_id=candidate.id,
            name=cert.get('name', 'Certification'),
            issuing_organization=cert.get('issuing_organization', ''),
            issue_date=cert.get('issue_date', ''),
            credential_id=cert.get('credential_id', '')
        ))
        
    db.session.flush()
    
    # 4. Perform Screening Match against the Job
    screening_data = match_candidate_to_job(candidate, job)
    match_score = screening_data['overall_match_score']
    
    # 5. Create Application
    application = Application(
        job_id=job.id,
        user_id=current_user.id if current_user else None,
        candidate_id=candidate.id,
        resume_id=resume.id,
        cover_letter=cover_letter,
        status='Applied',
        match_score=match_score
    )
    db.session.add(application)
    db.session.flush()
    
    resume.application_id = application.id
    
    # 6. Create Screening Result record
    sr = ScreeningResult(
        application_id=application.id,
        job_id=job.id,
        candidate_id=candidate.id,
        overall_match_score=match_score,
        required_skills_score=screening_data['sub_scores']['required_skills'],
        preferred_skills_score=screening_data['sub_scores']['preferred_skills'],
        experience_score=screening_data['sub_scores']['experience'],
        technical_skills_score=screening_data['sub_scores']['technical_skills'],
        projects_score=screening_data['sub_scores']['projects'],
        education_score=screening_data['sub_scores']['education'],
        certifications_score=screening_data['sub_scores']['certifications'],
        matched_requirements_json=json.dumps(screening_data['matched_requirements']),
        partial_requirements_json=json.dumps(screening_data['partial_requirements']),
        missing_requirements_json=json.dumps(screening_data['missing_requirements']),
        potential_concerns_json=json.dumps(screening_data['potential_concerns']),
        summary_explanation=screening_data['summary_explanation'],
        verification_tips=screening_data['verification_tips'],
        ai_interview_questions_json=json.dumps(screening_data['interview_questions']),
        weights_used_json=json.dumps(screening_data['weights_used'])
    )
    db.session.add(sr)
    db.session.flush()
    
    for m in screening_data['matrix']:
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
        candidate_id=candidate.id,
        application_id=application.id,
        old_status=None,
        new_status='Applied',
        changed_by=full_name,
        note='Application submitted successfully'
    ))
    
    db.session.commit()
    
    log_activity(
        event_type="application_submitted",
        description=f"New application received from '{candidate.full_name}' for '{job.title}'",
        entity_type="application",
        entity_id=application.id,
        metadata={'job_id': job.id, 'match_score': match_score}
    )
    
    return jsonify({
        'message': f"Your application for '{job.title}' was submitted successfully!",
        'application': application.to_dict(include_details=True, is_admin=False)
    }), 201

@applications_bp.route('/my', methods=['GET'])
@login_required
def get_my_applications():
    """
    Returns all applications submitted by the logged-in candidate.
    """
    current_user = get_current_user()
    apps = Application.query.filter_by(user_id=current_user.id).order_by(Application.created_at.desc()).all()
    
    # Also include any applications matched by email
    if current_user.email:
        email_candidates = Candidate.query.filter_by(email=current_user.email).all()
        cand_ids = [c.id for c in email_candidates]
        if cand_ids:
            email_apps = Application.query.filter(
                Application.candidate_id.in_(cand_ids),
                Application.user_id.is_(None)
            ).all()
            for ea in email_apps:
                ea.user_id = current_user.id
                db.session.commit()
                if ea not in apps:
                    apps.append(ea)
                    
    apps.sort(key=lambda a: a.created_at, reverse=True)
    return jsonify({
        'applications': [a.to_dict(include_details=False, is_admin=False) for a in apps],
        'total': len(apps)
    })

@applications_bp.route('/<int:app_id>', methods=['GET'])
def get_application_details(app_id):
    """
    Retrieves full details of a specific application.
    Enforces privacy: candidates can only view their own; admins can view all.
    """
    current_user = get_current_user()
    app = db.get_or_404(Application, app_id)
    
    is_admin = current_user and current_user.role == 'admin'
    
    # Candidate authorization check
    if not is_admin:
        if not current_user or (app.user_id != current_user.id and app.candidate.email != current_user.email):
            return jsonify({'error': 'Unauthorized to view this application.'}), 403
            
    return jsonify(app.to_dict(include_details=True, is_admin=is_admin))

@applications_bp.route('/job/<int:job_id>', methods=['GET'])
@admin_required
def get_job_applications(job_id):
    """
    Admin: Lists all candidate applications for a specific job position.
    Supports filtering by status, search query, and match range.
    """
    job = db.get_or_404(Job, job_id)
    status = request.args.get('status', '').strip()
    search = request.args.get('search', '').strip().lower()
    sort_by = request.args.get('sort_by', 'match_desc')
    
    query = Application.query.filter_by(job_id=job.id)
    
    if status and status.lower() != 'all':
        query = query.filter(Application.status.ilike(status))
        
    apps = query.all()
    
    # In-memory search filtering for candidate name, email, skills
    if search:
        filtered = []
        for a in apps:
            c = a.candidate
            if not c:
                continue
            skills_str = " ".join([s.name.lower() for s in c.skills])
            if (search in c.full_name.lower() or 
                search in c.email.lower() or 
                search in skills_str or
                search in c.location.lower()):
                filtered.append(a)
        apps = filtered
        
    # Sorting
    if sort_by == 'match_desc':
        apps.sort(key=lambda a: a.match_score, reverse=True)
    elif sort_by == 'match_asc':
        apps.sort(key=lambda a: a.match_score)
    elif sort_by == 'date_desc':
        apps.sort(key=lambda a: a.created_at, reverse=True)
    elif sort_by == 'date_asc':
        apps.sort(key=lambda a: a.created_at)
        
    return jsonify({
        'job': job.to_dict(),
        'applications': [a.to_dict(include_details=True, is_admin=True) for a in apps],
        'total': len(apps)
    })

@applications_bp.route('', methods=['GET'])
@admin_required
def list_all_applications():
    """
    Admin: Lists all applicants across all jobs with filtering & search.
    """
    status = request.args.get('status', '').strip()
    job_id = request.args.get('job_id')
    search = request.args.get('search', '').strip().lower()
    sort_by = request.args.get('sort_by', 'match_desc')
    
    query = Application.query
    if job_id and str(job_id).isdigit():
        query = query.filter_by(job_id=int(job_id))
    if status and status.lower() != 'all':
        query = query.filter(Application.status.ilike(status))
        
    apps = query.all()
    
    if search:
        filtered = []
        for a in apps:
            c = a.candidate
            if not c:
                continue
            skills_str = " ".join([s.name.lower() for s in c.skills])
            if (search in c.full_name.lower() or 
                search in c.email.lower() or 
                search in skills_str or
                (a.job and search in a.job.title.lower())):
                filtered.append(a)
        apps = filtered
        
    if sort_by == 'match_desc':
        apps.sort(key=lambda a: a.match_score, reverse=True)
    elif sort_by == 'match_asc':
        apps.sort(key=lambda a: a.match_score)
    elif sort_by == 'date_desc':
        apps.sort(key=lambda a: a.created_at, reverse=True)
    elif sort_by == 'date_asc':
        apps.sort(key=lambda a: a.created_at)
        
    return jsonify({
        'applications': [a.to_dict(include_details=True, is_admin=True) for a in apps],
        'total': len(apps)
    })

@applications_bp.route('/<int:app_id>/status', methods=['PUT'])
@admin_required
def update_application_status(app_id):
    """
    Admin: Updates recruitment pipeline status for an application.
    """
    current_user = get_current_user()
    app = db.get_or_404(Application, app_id)
    data = request.get_json() or {}
    new_status = data.get('status', '').strip()
    note_text = data.get('note', '').strip()
    
    valid_statuses = ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Rejected', 'Selected']
    if new_status not in valid_statuses:
        return jsonify({'error': f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400
        
    old_status = app.status
    app.status = new_status
    if app.candidate:
        app.candidate.status = new_status
        
    # Record in audit history
    history = StatusHistory(
        candidate_id=app.candidate_id,
        application_id=app.id,
        old_status=old_status,
        new_status=new_status,
        changed_by=current_user.full_name if current_user else 'Admin',
        note=note_text
    )
    db.session.add(history)
    db.session.commit()
    
    log_activity(
        event_type="status_changed",
        description=f"Status for applicant '{app.candidate.full_name if app.candidate else 'Candidate'}' updated to '{new_status}'",
        entity_type="application",
        entity_id=app.id,
        metadata={'old_status': old_status, 'new_status': new_status, 'note': note_text}
    )
    
    return jsonify({
        'message': f"Application status updated to '{new_status}'.",
        'application': app.to_dict(include_details=True, is_admin=True)
    })

@applications_bp.route('/<int:app_id>/notes', methods=['POST'])
@admin_required
def add_application_note(app_id):
    """
    Admin: Adds an internal recruiter note to an application.
    """
    current_user = get_current_user()
    app = db.get_or_404(Application, app_id)
    data = request.get_json() or {}
    content = data.get('content', '').strip()
    
    if not content:
        return jsonify({'error': 'Note content cannot be empty.'}), 400
        
    note = CandidateNote(
        candidate_id=app.candidate_id,
        application_id=app.id,
        author=current_user.full_name if current_user else 'Recruiter',
        content=content
    )
    db.session.add(note)
    db.session.commit()
    
    log_activity(
        event_type="note_added",
        description=f"Added internal note to applicant '{app.candidate.full_name if app.candidate else 'Candidate'}'",
        entity_type="application",
        entity_id=app.id
    )
    
    return jsonify({
        'message': 'Internal note added successfully.',
        'note': note.to_dict()
    }), 201

@applications_bp.route('/<int:app_id>/resume/download', methods=['GET'])
def download_application_resume(app_id):
    """
    Downloads original resume associated with this application.
    """
    current_user = get_current_user()
    app = db.get_or_404(Application, app_id)
    
    is_admin = current_user and current_user.role == 'admin'
    if not is_admin:
        if not current_user or (app.user_id != current_user.id and app.candidate.email != current_user.email):
            return jsonify({'error': 'Unauthorized to download this resume.'}), 403
            
    resume = app.resume or (app.candidate.resume if app.candidate else None)
    if not resume or not os.path.exists(os.path.abspath(resume.file_path)):
        return jsonify({'error': 'Resume file is not available on disk.'}), 404
        
    return send_file(
        os.path.abspath(resume.file_path),
        as_attachment=True,
        download_name=resume.filename
    )
