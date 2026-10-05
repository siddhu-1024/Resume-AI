import os
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, send_file
from backend.app.database import db
from backend.app.models import (
    Candidate, Resume, CandidateNote, StatusHistory, ScreeningResult, Job
)
from backend.app.utils.logger import log_activity

candidates_bp = Blueprint('candidates', __name__, url_prefix='/api/candidates')

@candidates_bp.route('', methods=['GET'])
def list_candidates():
    """
    List candidates with search, filters (job, status, match range, exp, skills), and sorting.
    """
    job_id = request.args.get('job_id')
    status = request.args.get('status', '').strip()
    search = request.args.get('search', '').strip().lower()
    min_match = request.args.get('min_match')
    max_match = request.args.get('max_match')
    min_exp = request.args.get('min_exp')
    sort_by = request.args.get('sort_by', 'match_desc')
    
    query = Candidate.query
    
    if job_id and str(job_id).isdigit():
        query = query.filter(Candidate.job_id == int(job_id))
        
    if status and status.lower() != 'all':
        query = query.filter(Candidate.status.ilike(status))
        
    if min_exp and str(min_exp).replace('.', '', 1).isdigit():
        query = query.filter(Candidate.total_experience_years >= float(min_exp))
        
    if search:
        query = query.filter(
            (Candidate.full_name.ilike(f"%{search}%")) |
            (Candidate.email.ilike(f"%{search}%")) |
            (Candidate.location.ilike(f"%{search}%")) |
            (Candidate.professional_summary.ilike(f"%{search}%"))
        )
        
    candidates = query.all()
    
    # Filter by match score in Python since ScreeningResult is a joined relation
    result_list = []
    for c in candidates:
        c_dict = c.to_dict()
        match_score = c_dict.get('latest_match_score')
        
        # Match score filters
        if min_match and str(min_match).replace('.', '', 1).isdigit():
            if match_score is None or match_score < float(min_match):
                continue
        if max_match and str(max_match).replace('.', '', 1).isdigit():
            if match_score is None or match_score > float(max_match):
                continue
                
        result_list.append(c_dict)
        
    # Sorting
    if sort_by == 'match_desc':
        result_list.sort(key=lambda x: (x.get('latest_match_score') is not None, x.get('latest_match_score') or 0), reverse=True)
    elif sort_by == 'match_asc':
        result_list.sort(key=lambda x: (x.get('latest_match_score') is not None, x.get('latest_match_score') or 0))
    elif sort_by == 'exp_desc':
        result_list.sort(key=lambda x: x.get('total_experience_years', 0), reverse=True)
    elif sort_by == 'name_asc':
        result_list.sort(key=lambda x: x.get('full_name', '').lower())
    elif sort_by == 'latest':
        result_list.sort(key=lambda x: x.get('created_at') or '', reverse=True)
    elif sort_by == 'status':
        result_list.sort(key=lambda x: x.get('status', ''))
        
    return jsonify({
        'candidates': result_list,
        'total': len(result_list)
    })

@candidates_bp.route('/<int:candidate_id>', methods=['GET'])
def get_candidate(candidate_id):
    """
    Returns full candidate profile and history.
    """
    cand = db.get_or_404(Candidate, candidate_id)
    return jsonify(cand.to_dict(include_details=True))

@candidates_bp.route('/<int:candidate_id>/status', methods=['PUT'])
def update_status(candidate_id):
    """
    Updates candidate pipeline status and appends to status audit history.
    """
    cand = db.get_or_404(Candidate, candidate_id)
    data = request.get_json() or {}
    new_status = data.get('status', '').strip()
    note_text = data.get('note', '').strip()
    changed_by = data.get('changed_by', 'Recruiter')
    
    valid_statuses = ['New', 'Screening', 'Shortlisted', 'Review Later', 'Interview', 'Rejected', 'Hired']
    if new_status not in valid_statuses:
        return jsonify({'error': f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400
        
    old_status = cand.status
    cand.status = new_status
    cand.updated_at = datetime.now(timezone.utc)
    
    # Add status history
    history = StatusHistory(
        candidate_id=cand.id,
        old_status=old_status,
        new_status=new_status,
        changed_by=changed_by,
        note=note_text
    )
    db.session.add(history)
    db.session.commit()
    
    log_activity(
        event_type="status_changed",
        description=f"Updated status of '{cand.full_name}' from '{old_status}' to '{new_status}'",
        entity_type="candidate",
        entity_id=cand.id,
        metadata={'old_status': old_status, 'new_status': new_status, 'note': note_text}
    )
    
    return jsonify({
        'message': f"Status updated to '{new_status}'.",
        'candidate': cand.to_dict(include_details=True)
    })

@candidates_bp.route('/<int:candidate_id>/notes', methods=['POST'])
def add_note(candidate_id):
    """
    Adds a recruiter note to candidate profile.
    """
    cand = db.get_or_404(Candidate, candidate_id)
    data = request.get_json() or {}
    content = data.get('content', '').strip()
    author = data.get('author', 'Recruiter')
    
    if not content:
        return jsonify({'error': 'Note content cannot be empty.'}), 400
        
    note = CandidateNote(
        candidate_id=cand.id,
        author=author,
        content=content
    )
    db.session.add(note)
    db.session.commit()
    
    log_activity(
        event_type="note_added",
        description=f"Added note to candidate '{cand.full_name}'",
        entity_type="candidate",
        entity_id=cand.id
    )
    
    return jsonify({
        'message': 'Note added successfully.',
        'note': note.to_dict()
    }), 201

@candidates_bp.route('/<int:candidate_id>/notes/<int:note_id>', methods=['DELETE'])
def delete_note(candidate_id, note_id):
    """
    Deletes a recruiter note.
    """
    note = CandidateNote.query.filter_by(id=note_id, candidate_id=candidate_id).first_or_404()
    db.session.delete(note)
    db.session.commit()
    return jsonify({'message': 'Note deleted.'})

@candidates_bp.route('/<int:candidate_id>/resume/download', methods=['GET'])
def download_resume(candidate_id):
    """
    Downloads the candidate's original resume document.
    """
    cand = db.get_or_404(Candidate, candidate_id)
    if not cand.resume or not os.path.exists(cand.resume.file_path):
        return jsonify({'error': 'Resume file is not available on disk.'}), 404
        
    return send_file(
        cand.resume.file_path,
        as_attachment=True,
        download_name=cand.resume.filename
    )

@candidates_bp.route('/<int:candidate_id>', methods=['DELETE'])
def delete_candidate(candidate_id):
    """
    Deletes a candidate record and uploaded resume file.
    """
    cand = db.get_or_404(Candidate, candidate_id)
    name = cand.full_name
    
    # Clean up file on disk if exists
    if cand.resume and os.path.exists(cand.resume.file_path):
        try:
            os.remove(cand.resume.file_path)
        except Exception:
            pass
            
    db.session.delete(cand)
    db.session.commit()
    
    log_activity(
        event_type="candidate_deleted",
        description=f"Deleted candidate '{name}'",
        entity_type="candidate",
        entity_id=candidate_id
    )
    
    return jsonify({'message': f"Candidate '{name}' deleted successfully."})
