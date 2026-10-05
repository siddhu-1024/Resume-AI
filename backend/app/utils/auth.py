from functools import wraps
from flask import session, jsonify, request
from backend.app.database import db
from backend.app.models.user import User

def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return None
    return db.session.get(User, user_id)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required. Please log in.'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Admin authentication required. Please log in as Admin.'}), 401
        if user.role != 'admin':
            return jsonify({'error': 'Forbidden. Admin privileges required.'}), 403
        return f(*args, **kwargs)
    return decorated_function

def candidate_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Candidate login required. Please log in to proceed.'}), 401
        if user.role != 'candidate':
            return jsonify({'error': 'Forbidden. Candidate account required.'}), 403
        return f(*args, **kwargs)
    return decorated_function

def ensure_default_admin():
    """
    Ensures a default administrator account exists for platform setup.
    """
    admin = User.query.filter_by(role='admin').first()
    if not admin:
        default_admin = User(
            email='admin@resumescreening.com',
            full_name='Lead Recruiter & Admin',
            role='admin',
            phone='555-0199',
            location='Headquarters'
        )
        default_admin.set_password('AdminPassword123!')
        db.session.add(default_admin)
        db.session.commit()
