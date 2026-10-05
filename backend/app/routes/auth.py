import re
from flask import Blueprint, request, jsonify, session
from backend.app.database import db
from backend.app.models.user import User
from backend.app.utils.auth import get_current_user, ensure_default_admin
from backend.app.utils.logger import log_activity

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Candidate Account Registration.
    """
    data = request.get_json() or {}
    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')
    phone = data.get('phone', '').strip()
    location = data.get('location', '').strip()
    
    # Validations
    if not full_name:
        return jsonify({'error': 'Please enter your full name.'}), 400
        
    if not email or not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
        return jsonify({'error': 'Please provide a valid email address.'}), 400
        
    if not password or len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters in length.'}), 400
        
    if password != confirm_password:
        return jsonify({'error': 'Passwords do not match. Please re-enter.'}), 400
        
    # Check duplicate email
    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({'error': 'An account with this email address already exists. Please log in.'}), 409
        
    # Create candidate user
    user = User(
        email=email,
        full_name=full_name,
        role='candidate',
        phone=phone,
        location=location
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    
    # Set session
    session['user_id'] = user.id
    session['role'] = user.role
    
    log_activity(
        event_type='candidate_registered',
        description=f"New candidate registered: {user.full_name} ({user.email})",
        entity_type='user',
        entity_id=user.id
    )
    
    return jsonify({
        'message': 'Account created successfully. Welcome to Resume Screening Assistant!',
        'user': user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticates Candidates and Admins.
    """
    # Ensure default admin exists
    ensure_default_admin()
    
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    expected_role = data.get('expected_role', '').strip().lower()  # 'admin' or 'candidate' (optional constraint)
    
    if not email or not password:
        return jsonify({'error': 'Please enter both email and password.'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email address or password. Please try again.'}), 401
        
    # Check if specific role portal was expected
    if expected_role and user.role != expected_role:
        if expected_role == 'admin':
            return jsonify({'error': 'This account does not have Admin privileges. Please use the Candidate Login.'}), 403
        elif expected_role == 'candidate' and user.role == 'admin':
            # Allow admin to log in to candidate view if desired, or inform
            pass
            
    # Set session
    session['user_id'] = user.id
    session['role'] = user.role
    
    log_activity(
        event_type='user_login',
        description=f"User logged in: {user.full_name} ({user.role})",
        entity_type='user',
        entity_id=user.id
    )
    
    return jsonify({
        'message': f"Welcome back, {user.full_name}!",
        'user': user.to_dict()
    })

@auth_bp.route('/me', methods=['GET'])
def get_me():
    """
    Returns the currently authenticated user's profile.
    """
    user = get_current_user()
    if not user:
        return jsonify({
            'authenticated': False,
            'user': None
        })
        
    return jsonify({
        'authenticated': True,
        'user': user.to_dict()
    })

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Logs out the current session.
    """
    user_id = session.get('user_id')
    session.clear()
    return jsonify({'message': 'You have been logged out successfully.'})
