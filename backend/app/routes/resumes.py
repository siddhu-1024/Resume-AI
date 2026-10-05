import os
import json
import uuid
from flask import Blueprint, request, jsonify, current_app
from backend.app.database import db
from backend.app.models import (
    Job, Candidate, Resume, CandidateSkill, Experience,
    Education, Project, Certification, ScreeningResult, RequirementMatch
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
from backend.app.utils.logger import log_activity

resumes_bp = Blueprint('resumes', __name__, url_prefix='/api/resumes')

@resumes_bp.route('/upload', methods=['POST'])
def upload_resumes():
    """
    Handles single and batch resume uploads (PDF / DOCX), parses text,
    stores records, and automatically triggers screening for selected job.
    """
    job_id = request.form.get('job_id')
    job = None
    if job_id and str(job_id).isdigit():
        job = db.session.get(Job, int(job_id))
        
    uploaded_files = request.files.getlist('files') or request.files.getlist('files[]')
    if not uploaded_files:
        single_file = request.files.get('file')
        if single_file:
            uploaded_files = [single_file]
            
    if not uploaded_files:
        return jsonify({'error': 'No resume files received in request.'}), 400
        
    results = []
    upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    os.makedirs(upload_folder, exist_ok=True)
    
    for file_storage in uploaded_files:
        original_name = file_storage.filename
        if not original_name:
            continue
            
        is_valid, err_msg, ext, file_bytes = validate_resume_file(file_storage)
        if not is_valid:
            results.append({
                'filename': original_name,
                'status': 'failed',
                'error': err_msg or "Unable to read this resume. Please upload a valid PDF or DOCX file."
            })
            continue
            
        file_hash = compute_file_hash(file_bytes)
        
        # Check for duplicate resume in database
        existing_resume = Resume.query.filter_by(file_hash=file_hash).first()
        is_duplicate = existing_resume is not None
        
        # Save file to disk
        unique_prefix = uuid.uuid4().hex[:8]
        safe_name = f"{unique_prefix}_{sanitize_filename(original_name)}"
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
            # Store failed record or return informative error
            results.append({
                'filename': original_name,
                'status': 'failed',
                'error': parse_err or "Unable to read this resume. Please upload a valid PDF or DOCX file."
            })
            continue
            
        # Extract structured candidate data
        parsed = parse_resume_content(raw_text)
        
        # Create Candidate record
        candidate = Candidate(
            job_id=job.id if job else None,
            full_name=parsed['full_name'],
            email=parsed['email'] if parsed['email'] != 'Not detected' else '',
            phone=parsed['phone'] if parsed['phone'] != 'Not detected' else '',
            location=parsed['location'] if parsed['location'] != 'Not detected' else '',
            linkedin_url=parsed['linkedin_url'],
            github_url=parsed['github_url'],
            portfolio_url=parsed['portfolio_url'],
            professional_summary=parsed['professional_summary'],
            total_experience_years=parsed['total_experience_years'],
            highest_education=parsed['highest_education'],
            status='New',
            is_demo=False
        )
        db.session.add(candidate)
        db.session.flush()
        
        # Create Resume record
        resume = Resume(
            candidate_id=candidate.id,
            filename=original_name,
            file_path=file_path,
            file_type=ext,
            file_size_bytes=len(file_bytes),
            file_hash=file_hash,
            raw_text=raw_text,
            parsed_data_json=json.dumps(parsed),
            parsing_status='success',
            parsing_error=''
        )
        db.session.add(resume)
        
        # Add Skills
        for sk in parsed.get('skills', []):
            db.session.add(CandidateSkill(
                candidate_id=candidate.id,
                name=sk['name'],
                category=sk.get('category', 'technical'),
                proficiency='Detected'
            ))
            
        # Add Experience
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
            
        # Add Education
        for edu in parsed.get('education', []):
            db.session.add(Education(
                candidate_id=candidate.id,
                degree=edu.get('degree', 'Degree'),
                field_of_study=edu.get('field_of_study', ''),
                institution=edu.get('institution', 'Institution'),
                graduation_year=edu.get('graduation_year', ''),
                grade_or_gpa=edu.get('grade_or_gpa', '')
            ))
            
        # Add Projects
        for proj in parsed.get('projects', []):
            db.session.add(Project(
                candidate_id=candidate.id,
                title=proj.get('title', 'Project'),
                description=proj.get('description', ''),
                technologies=proj.get('technologies', ''),
                url=proj.get('url', '')
            ))
            
        # Add Certifications
        for cert in parsed.get('certifications', []):
            db.session.add(Certification(
                candidate_id=candidate.id,
                name=cert.get('name', 'Certification'),
                issuing_organization=cert.get('issuing_organization', ''),
                issue_date=cert.get('issue_date', ''),
                credential_id=cert.get('credential_id', '')
            ))
            
        db.session.flush()
        
        # If job is selected, calculate screening match immediately
        screening_data = None
        if job:
            screening_data = match_candidate_to_job(candidate, job)
            sr = ScreeningResult(
                job_id=job.id,
                candidate_id=candidate.id,
                overall_match_score=screening_data['overall_match_score'],
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
                
        db.session.commit()
        
        log_activity(
            event_type="resume_uploaded",
            description=f"Uploaded and parsed resume for '{candidate.full_name}' ({original_name})",
            entity_type="candidate",
            entity_id=candidate.id,
            metadata={'is_duplicate': is_duplicate, 'job_id': job.id if job else None}
        )
        
        results.append({
            'filename': original_name,
            'status': 'success',
            'is_duplicate': is_duplicate,
            'candidate_id': candidate.id,
            'candidate_name': candidate.full_name,
            'match_score': screening_data['overall_match_score'] if screening_data else None,
            'job_title': job.title if job else 'Unassigned'
        })
        
    return jsonify({
        'message': f"Processed {len(results)} resume(s).",
        'results': results
    })
