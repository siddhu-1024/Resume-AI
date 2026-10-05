from flask import Blueprint, jsonify, request
from backend.app.models.system import ActivityLog

activity_bp = Blueprint('activity', __name__, url_prefix='/api/activity')

@activity_bp.route('', methods=['GET'])
def list_activity():
    """
    Returns recent activity logs stream.
    """
    limit = request.args.get('limit', 20, type=int)
    logs = ActivityLog.query.order_by(ActivityLog.created_at.desc()).limit(limit).all()
    return jsonify({
        'activities': [l.to_dict() for l in logs]
    })
