import os
from flask import Flask, render_template, jsonify, send_from_directory
from backend.app.config import Config
from backend.app.database import db
from backend.app.routes import (
    auth_bp,
    applications_bp,
    jobs_bp,
    resumes_bp,
    screening_bp,
    candidates_bp,
    reports_bp,
    settings_bp,
    ai_bp,
    activity_bp
)
from backend.app.utils.auth import ensure_default_admin

def create_app(config_class=Config):
    app = Flask(
        __name__,
        template_folder=Config.TEMPLATE_FOLDER,
        static_folder=Config.STATIC_FOLDER
    )
    app.config.from_object(config_class)
    
    # Initialize Database
    db.init_app(app)
    
    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(applications_bp)
    app.register_blueprint(jobs_bp)
    app.register_blueprint(resumes_bp)
    app.register_blueprint(screening_bp)
    app.register_blueprint(candidates_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(activity_bp)
    
    # Ensure upload directory exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Health Check Endpoints (for Render and uptime monitoring)
    @app.route('/health')
    @app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'resume-ai',
            'version': '1.0.0'
        }), 200

    # Root SPA route
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_spa(path):
        # Don't intercept API routes
        if path.startswith('api/'):
            return jsonify({'error': 'API endpoint not found'}), 404
        return render_template('index.html')
        
    # Error Handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Resource not found'}), 404
        
    @app.errorhandler(413)
    def file_too_large(e):
        return jsonify({'error': 'File size exceeds maximum allowable limit (16MB).'}), 413
        
    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'error': 'Internal server error occurred.'}), 500
        
    # Create DB tables inside app context
    with app.app_context():
        db.create_all()
        # Schema migration helper for existing SQLite databases
        if db.engine.name == 'sqlite':
            try:
                from sqlalchemy import text
                with db.engine.connect() as conn:
                    # 1. Candidates table user_id
                    cols = [row[1] for row in conn.execute(text("PRAGMA table_info(candidates)")).fetchall()]
                    if 'user_id' not in cols and len(cols) > 0:
                        conn.execute(text("ALTER TABLE candidates ADD COLUMN user_id INTEGER REFERENCES users(id)"))
                        conn.commit()
                    # 2. Resumes table application_id
                    r_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(resumes)")).fetchall()]
                    if 'application_id' not in r_cols and len(r_cols) > 0:
                        conn.execute(text("ALTER TABLE resumes ADD COLUMN application_id INTEGER"))
                        conn.commit()
                    # 3. Screening results application_id
                    s_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(screening_results)")).fetchall()]
                    if 'application_id' not in s_cols and len(s_cols) > 0:
                        conn.execute(text("ALTER TABLE screening_results ADD COLUMN application_id INTEGER REFERENCES applications(id)"))
                        conn.commit()
                    # 4. Candidate notes application_id
                    n_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(candidate_notes)")).fetchall()]
                    if 'application_id' not in n_cols and len(n_cols) > 0:
                        conn.execute(text("ALTER TABLE candidate_notes ADD COLUMN application_id INTEGER REFERENCES applications(id)"))
                        conn.commit()
                    # 5. Status history application_id
                    h_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(candidate_status_history)")).fetchall()]
                    if 'application_id' not in h_cols and len(h_cols) > 0:
                        conn.execute(text("ALTER TABLE candidate_status_history ADD COLUMN application_id INTEGER REFERENCES applications(id)"))
                        conn.commit()
            except Exception as e:
                app.logger.warning(f"Schema sync notice: {e}")

        ensure_default_admin()
        
    return app
