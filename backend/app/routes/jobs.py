import json
from flask import Blueprint, request, jsonify
from backend.app.database import db
from backend.app.models import Job, JobRequirement, Candidate, ScreeningResult
from backend.app.parsers.job_analyzer import analyze_job_description
from backend.app.utils.logger import log_activity

jobs_bp = Blueprint('jobs', __name__, url_prefix='/api/jobs')

@jobs_bp.route('', methods=['GET'])
def list_jobs():
    """
    Lists all jobs with candidate counts and screening stats.
    """
    search = request.args.get('search', '').strip().lower()
    status = request.args.get('status', '').strip()
    
    query = Job.query
    if status and status.lower() != 'all':
        query = query.filter(Job.status.ilike(status))
    if search:
        query = query.filter(
            (Job.title.ilike(f"%{search}%")) |
            (Job.department.ilike(f"%{search}%")) |
            (Job.location.ilike(f"%{search}%"))
        )
        
    jobs = query.order_by(Job.created_at.desc()).all()
    return jsonify({
        'jobs': [j.to_dict() for j in jobs],
        'total': len(jobs)
    })

@jobs_bp.route('/<int:job_id>', methods=['GET'])
def get_job(job_id):
    """
    Gets single job details and requirements.
    """
    job = db.get_or_404(Job, job_id)
    job_dict = job.to_dict()
    job_dict['requirements'] = [r.to_dict() for r in job.requirements]
    return jsonify(job_dict)

@jobs_bp.route('/analyze-preview', methods=['POST'])
def analyze_preview():
    """
    Real-time NLP preview of job description without persisting.
    """
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    description = data.get('raw_description', '').strip()
    responsibilities = data.get('responsibilities_text', '').strip()
    qualifications = data.get('qualifications_text', '').strip()
    
    if not title and not description:
        return jsonify({'error': 'Please provide a job title or description to analyze.'}), 400
        
    analysis = analyze_job_description(title, description, responsibilities, qualifications)
    return jsonify(analysis)

@jobs_bp.route('', methods=['POST'])
def create_job():
    """
    Creates a new Job position and extracts requirements.
    """
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    
    if not title:
        return jsonify({'error': 'Job Title is required.'}), 400
        
    description = data.get('raw_description', '').strip()
    responsibilities = data.get('responsibilities_text', '').strip()
    qualifications = data.get('qualifications_text', '').strip()
    
    # Run NLP Analysis
    analysis = analyze_job_description(title, description, responsibilities, qualifications)
    
    # Custom required/preferred skills if explicitly passed from form
    req_skills = data.get('required_skills')
    if req_skills is None or not isinstance(req_skills, list):
        req_skills = analysis['required_skills']
        
    pref_skills = data.get('preferred_skills')
    if pref_skills is None or not isinstance(pref_skills, list):
        pref_skills = analysis['preferred_skills']
        
    min_exp = data.get('min_experience_years')
    try:
        min_exp = float(min_exp) if min_exp is not None and str(min_exp).strip() != '' else analysis['min_experience_years']
    except Exception:
        min_exp = analysis['min_experience_years']
        
    edu_level = data.get('education_level') or analysis['education_requirement']
    
    job = Job(
        title=title,
        department=data.get('department', 'Engineering') or 'Engineering',
        location=data.get('location', 'Remote') or 'Remote',
        employment_type=data.get('employment_type', 'Full-time') or 'Full-time',
        min_experience_years=min_exp,
        education_level=edu_level,
        salary_range=data.get('salary_range', '') or '',
        status=data.get('status', 'Active') or 'Active',
        raw_description=description,
        responsibilities_text=responsibilities,
        qualifications_text=qualifications,
        required_skills=json.dumps(req_skills),
        preferred_skills=json.dumps(pref_skills),
        extracted_keywords=json.dumps(analysis['keywords']),
        extracted_data_json=json.dumps(analysis),
        is_demo=False
    )
    
    db.session.add(job)
    db.session.flush()
    
    # Create JobRequirement records
    for s in req_skills:
        db.session.add(JobRequirement(
            job_id=job.id,
            category='required_skill',
            title=s,
            description=f"Demonstrated experience with {s}",
            weight=1.0
        ))
    for s in pref_skills:
        db.session.add(JobRequirement(
            job_id=job.id,
            category='preferred_skill',
            title=s,
            description=f"Preferred familiarity with {s}",
            weight=0.5
        ))
    if min_exp > 0:
        db.session.add(JobRequirement(
            job_id=job.id,
            category='experience',
            title=f"{min_exp:.1f}+ Years Relevant Experience",
            description=f"Minimum {min_exp:.1f} years of professional experience",
            weight=1.0
        ))
        
    db.session.commit()
    
    log_activity(
        event_type="job_created",
        description=f"Created job vacancy '{job.title}' ({job.department})",
        entity_type="job",
        entity_id=job.id
    )
    
    return jsonify({
        'message': f"Job '{job.title}' created successfully.",
        'job': job.to_dict()
    }), 201

@jobs_bp.route('/<int:job_id>', methods=['PUT'])
def update_job(job_id):
    """
    Updates job details and requirements.
    """
    job = db.get_or_404(Job, job_id)
    data = request.get_json() or {}
    
    if 'title' in data and data['title'].strip():
        job.title = data['title'].strip()
    if 'department' in data:
        job.department = data['department'].strip()
    if 'location' in data:
        job.location = data['location'].strip()
    if 'employment_type' in data:
        job.employment_type = data['employment_type'].strip()
    if 'min_experience_years' in data:
        try:
            job.min_experience_years = float(data['min_experience_years'])
        except Exception:
            pass
    if 'education_level' in data:
        job.education_level = data['education_level'].strip()
    if 'salary_range' in data:
        job.salary_range = data['salary_range'].strip()
    if 'status' in data:
        job.status = data['status'].strip()
    if 'raw_description' in data:
        job.raw_description = data['raw_description'].strip()
    if 'responsibilities_text' in data:
        job.responsibilities_text = data['responsibilities_text'].strip()
    if 'qualifications_text' in data:
        job.qualifications_text = data['qualifications_text'].strip()
        
    if 'required_skills' in data and isinstance(data['required_skills'], list):
        job.required_skills = json.dumps(data['required_skills'])
    if 'preferred_skills' in data and isinstance(data['preferred_skills'], list):
        job.preferred_skills = json.dumps(data['preferred_skills'])
        
    db.session.commit()
    return jsonify({
        'message': f"Job '{job.title}' updated successfully.",
        'job': job.to_dict()
    })

@jobs_bp.route('/<int:job_id>', methods=['DELETE'])
def delete_job(job_id):
    """
    Deletes a job position and associated records.
    """
    job = db.get_or_404(Job, job_id)
    title = job.title
    db.session.delete(job)
    db.session.commit()
    
    log_activity(
        event_type="job_deleted",
        description=f"Deleted job position '{title}'",
        entity_type="job",
        entity_id=job_id
    )
    
    return jsonify({'message': f"Job '{title}' deleted successfully."})
