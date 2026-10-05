from flask import Blueprint, request, jsonify
from backend.app.database import db
from backend.app.models import Candidate, Job
from backend.app.services.ai_service import generate_ai_candidate_insights

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')

@ai_bp.route('/candidate-insights', methods=['POST'])
def candidate_insights():
    """
    Generates grounded candidate insights, strengths, growth areas, and tailored interview questions.
    """
    data = request.get_json() or {}
    candidate_id = data.get('candidate_id')
    job_id = data.get('job_id')
    
    if not candidate_id:
        return jsonify({'error': 'Candidate ID is required.'}), 400
        
    cand = db.get_or_404(Candidate, int(candidate_id))
    job = db.session.get(Job, int(job_id)) if job_id else cand.job
    
    if not job:
        return jsonify({'error': 'Job position is required for contextual AI analysis.'}), 400
        
    screening_result = cand.screening_results[-1] if cand.screening_results else None
    
    insights = generate_ai_candidate_insights(cand, job, screening_result)
    return jsonify(insights)
