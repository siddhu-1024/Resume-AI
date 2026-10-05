import json
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from backend.app.database import db
from backend.app.models import (
    Job, Candidate, ScreeningResult, RequirementMatch, ActivityLog
)
from backend.app.screening.matcher import match_candidate_to_job
from backend.app.utils.logger import log_activity

screening_bp = Blueprint('screening', __name__, url_prefix='/api/screening')

@screening_bp.route('/run', methods=['POST'])
def run_screening():
    """
    Triggers screening analysis for a single candidate or all candidates under a job.
    """
    data = request.get_json() or {}
    job_id = data.get('job_id')
    candidate_id = data.get('candidate_id')
    
    if not job_id:
        return jsonify({'error': 'Job ID is required for screening.'}), 400
        
    job = db.get_or_404(Job, int(job_id))
    
    candidates_to_screen = []
    if candidate_id:
        cand = db.get_or_404(Candidate, int(candidate_id))
        candidates_to_screen.append(cand)
    else:
        # Screen all candidates associated with this job or unassigned
        candidates_to_screen = Candidate.query.filter(
            (Candidate.job_id == job.id) | (Candidate.job_id.is_(None))
        ).all()
        
    if not candidates_to_screen:
        return jsonify({'error': 'No candidates found to screen for this position.'}), 404
        
    results = []
    now = datetime.now(timezone.utc)
    
    for cand in candidates_to_screen:
        # Link candidate to job if not assigned
        if cand.job_id is None:
            cand.job_id = job.id
            
        match_data = match_candidate_to_job(cand, job)
        
        # Remove previous screening result for this job & candidate
        old_results = ScreeningResult.query.filter_by(job_id=job.id, candidate_id=cand.id).all()
        for r in old_results:
            db.session.delete(r)
            
        sr = ScreeningResult(
            job_id=job.id,
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
            screened_at=now
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
            
        results.append({
            'candidate_id': cand.id,
            'candidate_name': cand.full_name,
            'match_score': match_data['overall_match_score'],
            'matched_count': len(match_data['matched_requirements']),
            'missing_count': len(match_data['missing_requirements'])
        })
        
    db.session.commit()
    
    log_activity(
        event_type="screening_completed",
        description=f"Completed screening for {len(results)} candidate(s) under '{job.title}'",
        entity_type="job",
        entity_id=job.id
    )
    
    return jsonify({
        'message': f"Screening completed for {len(results)} candidate(s).",
        'results': results
    })

@screening_bp.route('/matrix/<int:candidate_id>', methods=['GET'])
def get_screening_matrix(candidate_id):
    """
    Returns full requirement-by-requirement evidence matrix for a candidate.
    """
    cand = db.get_or_404(Candidate, candidate_id)
    latest_screening = cand.screening_results[-1] if cand.screening_results else None
    
    if not latest_screening:
        return jsonify({'error': 'Candidate has not been screened yet.'}), 404
        
    return jsonify(latest_screening.to_dict(include_matrix=True))

@screening_bp.route('/compare', methods=['POST'])
def compare_candidates():
    """
    Compares 2 to 4 candidates side-by-side for a specific job position.
    """
    data = request.get_json() or {}
    candidate_ids = data.get('candidate_ids', [])
    job_id = data.get('job_id')
    
    if not candidate_ids or len(candidate_ids) < 2:
        return jsonify({'error': 'Please select at least 2 candidates to compare.'}), 400
        
    if len(candidate_ids) > 4:
        candidate_ids = candidate_ids[:4]
        
    candidates = Candidate.query.filter(Candidate.id.in_(candidate_ids)).all()
    job = db.session.get(Job, int(job_id)) if job_id else (candidates[0].job if candidates else None)
    
    comparison_data = []
    for c in candidates:
        latest = c.screening_results[-1] if c.screening_results else None
        
        comparison_data.append({
            'id': c.id,
            'name': c.full_name,
            'status': c.status,
            'experience_years': round(c.total_experience_years, 1),
            'highest_education': c.highest_education,
            'match_score': round(latest.overall_match_score, 1) if latest else None,
            'sub_scores': latest.to_dict()['scores'] if latest else {},
            'matched_requirements': latest.get_matched() if latest else [],
            'missing_requirements': latest.get_missing() if latest else [],
            'potential_concerns': latest.get_concerns() if latest else [],
            'top_skills': [s.name for s in c.skills[:10]],
            'projects_count': len(c.projects),
            'certifications_count': len(c.certifications),
            'summary_explanation': latest.summary_explanation if latest else "Not screened"
        })
        
    return jsonify({
        'job': job.to_dict() if job else None,
        'candidates': comparison_data
    })
