import io
from flask import Blueprint, request, jsonify, Response, send_file
from backend.app.database import db
from backend.app.models import (
    Job, Candidate, ScreeningResult, CandidateSkill
)
from backend.app.services.report_service import (
    generate_candidates_csv,
    generate_screening_pdf_report
)
from backend.app.utils.logger import log_activity

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@reports_bp.route('/analytics', methods=['GET'])
def get_analytics():
    """
    Computes comprehensive screening metrics, pipeline distribution,
    skill demand vs candidate skill presence, and recent activity.
    """
    job_id = request.args.get('job_id')
    
    cand_query = Candidate.query
    job = None
    if job_id and str(job_id).isdigit():
        cand_query = cand_query.filter(Candidate.job_id == int(job_id))
        job = db.session.get(Job, int(job_id))
        
    candidates = cand_query.all()
    total_candidates = len(candidates)
    
    screened_candidates = [c for c in candidates if c.screening_results]
    screened_count = len(screened_candidates)
    
    # Status breakdown
    pipeline_counts = {
        'New': len([c for c in candidates if c.status == 'New']),
        'Screening': len([c for c in candidates if c.status == 'Screening']),
        'Shortlisted': len([c for c in candidates if c.status == 'Shortlisted']),
        'Review Later': len([c for c in candidates if c.status == 'Review Later']),
        'Interview': len([c for c in candidates if c.status == 'Interview']),
        'Rejected': len([c for c in candidates if c.status == 'Rejected']),
        'Hired': len([c for c in candidates if c.status == 'Hired'])
    }
    
    # Average Match Score
    scores = [c.screening_results[-1].overall_match_score for c in screened_candidates]
    avg_match = sum(scores) / len(scores) if scores else 0.0
    
    # Score distribution brackets
    match_distribution = {
        '80-100% (High Match)': len([s for s in scores if s >= 80]),
        '60-79% (Moderate Match)': len([s for s in scores if 60 <= s < 80]),
        '40-59% (Partial Match)': len([s for s in scores if 40 <= s < 60]),
        '<40% (Low Match)': len([s for s in scores if s < 40])
    }
    
    # Most common skills detected across candidates
    skill_counts = {}
    for c in candidates:
        for s in c.skills:
            skill_counts[s.name] = skill_counts.get(s.name, 0) + 1
            
    top_candidate_skills = sorted(
        [{'name': k, 'count': v} for k, v in skill_counts.items()],
        key=lambda x: x['count'],
        reverse=True
    )[:12]
    
    # Common missing requirements across screened candidates
    missing_skill_counts = {}
    for c in screened_candidates:
        latest = c.screening_results[-1]
        for m in latest.get_missing():
            missing_skill_counts[m] = missing_skill_counts.get(m, 0) + 1
            
    top_missing_skills = sorted(
        [{'name': k, 'count': v} for k, v in missing_skill_counts.items()],
        key=lambda x: x['count'],
        reverse=True
    )[:10]
    
    # Top 5 matching candidates
    top_candidates = sorted(
        screened_candidates,
        key=lambda c: c.screening_results[-1].overall_match_score,
        reverse=True
    )[:5]
    
    return jsonify({
        'job': job.to_dict(include_candidates_count=False) if job else None,
        'summary': {
            'total_candidates': total_candidates,
            'screened_count': screened_count,
            'shortlisted_count': pipeline_counts['Shortlisted'],
            'review_count': pipeline_counts['Review Later'],
            'interview_count': pipeline_counts['Interview'],
            'rejected_count': pipeline_counts['Rejected'],
            'hired_count': pipeline_counts['Hired'],
            'avg_match': round(avg_match, 1)
        },
        'pipeline': pipeline_counts,
        'match_distribution': match_distribution,
        'top_candidate_skills': top_candidate_skills,
        'top_missing_skills': top_missing_skills,
        'top_candidates': [c.to_dict() for c in top_candidates]
    })

@reports_bp.route('/export/csv', methods=['GET'])
def export_csv():
    """
    Downloads CSV spreadsheet of candidate screening data.
    """
    job_id = request.args.get('job_id')
    cand_query = Candidate.query
    job = None
    if job_id and str(job_id).isdigit():
        cand_query = cand_query.filter(Candidate.job_id == int(job_id))
        job = db.session.get(Job, int(job_id))
        
    candidates = cand_query.all()
    csv_content = generate_candidates_csv(candidates, job)
    
    log_activity(
        event_type="report_generated",
        description=f"Exported screening CSV report ({len(candidates)} candidates)",
        entity_type="report"
    )
    
    filename = f"Screening_Report_{job.title.replace(' ', '_') if job else 'All'}.csv"
    return Response(
        csv_content,
        mimetype="text/csv",
        headers={"Content-disposition": f"attachment; filename={filename}"}
    )

@reports_bp.route('/export/pdf', methods=['GET'])
def export_pdf():
    """
    Downloads executive PDF screening report.
    """
    job_id = request.args.get('job_id')
    cand_query = Candidate.query
    job = None
    if job_id and str(job_id).isdigit():
        cand_query = cand_query.filter(Candidate.job_id == int(job_id))
        job = db.session.get(Job, int(job_id))
        
    candidates = cand_query.all()
    screened = [c for c in candidates if c.screening_results]
    scores = [c.screening_results[-1].overall_match_score for c in screened]
    
    stats = {
        'total_candidates': len(candidates),
        'screened_count': len(screened),
        'shortlisted_count': len([c for c in candidates if c.status == 'Shortlisted']),
        'review_count': len([c for c in candidates if c.status == 'Review Later']),
        'avg_match': sum(scores) / len(scores) if scores else 0.0
    }
    
    pdf_bytes = generate_screening_pdf_report(job, candidates, stats)
    
    log_activity(
        event_type="report_generated",
        description=f"Generated executive PDF screening report ({len(candidates)} candidates)",
        entity_type="report"
    )
    
    filename = f"Screening_Report_{job.title.replace(' ', '_') if job else 'All'}.pdf"
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=filename
    )
