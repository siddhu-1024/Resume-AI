import json
from datetime import datetime, timezone
from backend.app.database import db, BaseModel

class ScreeningResult(BaseModel):
    __tablename__ = 'screening_results'
    
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id'), nullable=False)
    
    overall_match_score = db.Column(db.Float, nullable=False, default=0.0)  # 0 to 100
    required_skills_score = db.Column(db.Float, default=0.0)
    preferred_skills_score = db.Column(db.Float, default=0.0)
    experience_score = db.Column(db.Float, default=0.0)
    technical_skills_score = db.Column(db.Float, default=0.0)
    projects_score = db.Column(db.Float, default=0.0)
    education_score = db.Column(db.Float, default=0.0)
    certifications_score = db.Column(db.Float, default=0.0)
    
    # JSON breakdown
    matched_requirements_json = db.Column(db.Text, default='[]')
    partial_requirements_json = db.Column(db.Text, default='[]')
    missing_requirements_json = db.Column(db.Text, default='[]')
    potential_concerns_json = db.Column(db.Text, default='[]')
    
    summary_explanation = db.Column(db.Text, default='')
    verification_tips = db.Column(db.Text, default='')
    ai_interview_questions_json = db.Column(db.Text, default='[]')
    weights_used_json = db.Column(db.Text, default='{}')
    
    screened_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    requirement_matches = db.relationship('RequirementMatch', backref='screening_result', cascade='all, delete-orphan', lazy=True)
    
    def get_matched(self):
        try:
            return json.loads(self.matched_requirements_json) if self.matched_requirements_json else []
        except Exception:
            return []
            
    def get_partial(self):
        try:
            return json.loads(self.partial_requirements_json) if self.partial_requirements_json else []
        except Exception:
            return []
            
    def get_missing(self):
        try:
            return json.loads(self.missing_requirements_json) if self.missing_requirements_json else []
        except Exception:
            return []
            
    def get_concerns(self):
        try:
            return json.loads(self.potential_concerns_json) if self.potential_concerns_json else []
        except Exception:
            return []
            
    def get_interview_questions(self):
        try:
            return json.loads(self.ai_interview_questions_json) if self.ai_interview_questions_json else []
        except Exception:
            return []
            
    def get_weights(self):
        try:
            return json.loads(self.weights_used_json) if self.weights_used_json else {}
        except Exception:
            return {}

    def to_dict(self, include_matrix=True):
        data = {
            'id': self.id,
            'application_id': self.application_id,
            'job_id': self.job_id,
            'candidate_id': self.candidate_id,
            'overall_match_score': round(self.overall_match_score, 1),
            'scores': {
                'required_skills': round(self.required_skills_score, 1),
                'preferred_skills': round(self.preferred_skills_score, 1),
                'experience': round(self.experience_score, 1),
                'technical_skills': round(self.technical_skills_score, 1),
                'projects': round(self.projects_score, 1),
                'education': round(self.education_score, 1),
                'certifications': round(self.certifications_score, 1)
            },
            'matched_requirements': self.get_matched(),
            'partial_requirements': self.get_partial(),
            'missing_requirements': self.get_missing(),
            'potential_concerns': self.get_concerns(),
            'summary_explanation': self.summary_explanation,
            'verification_tips': self.verification_tips,
            'interview_questions': self.get_interview_questions(),
            'weights_used': self.get_weights(),
            'screened_at': self.screened_at.isoformat() if self.screened_at else None
        }
        if include_matrix:
            data['matrix'] = [rm.to_dict() for rm in self.requirement_matches]
        return data


class RequirementMatch(BaseModel):
    __tablename__ = 'requirement_matches'
    
    id = db.Column(db.Integer, primary_key=True)
    screening_result_id = db.Column(db.Integer, db.ForeignKey('screening_results.id'), nullable=False)
    
    requirement_title = db.Column(db.String(255), nullable=False)
    requirement_type = db.Column(db.String(50), default='skill')  # skill, experience, education, responsibility, certification
    # Status: 'Matched', 'Partially Matched', 'Not Detected', 'Below Requirement'
    match_status = db.Column(db.String(50), nullable=False, default='Not Detected')
    candidate_evidence = db.Column(db.Text, default='Not detected')
    relevance_score = db.Column(db.Float, default=0.0)
    
    def to_dict(self):
        return {
            'id': self.id,
            'requirement_title': self.requirement_title,
            'requirement_type': self.requirement_type,
            'match_status': self.match_status,
            'candidate_evidence': self.candidate_evidence,
            'relevance_score': round(self.relevance_score, 2)
        }


class CandidateNote(BaseModel):
    __tablename__ = 'candidate_notes'
    
    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id'), nullable=False)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=True)
    author = db.Column(db.String(100), default='Recruiter')
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        return {
            'id': self.id,
            'candidate_id': self.candidate_id,
            'application_id': self.application_id,
            'author': self.author,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class StatusHistory(BaseModel):
    __tablename__ = 'candidate_status_history'
    
    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id'), nullable=False)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=True)
    old_status = db.Column(db.String(50))
    new_status = db.Column(db.String(50), nullable=False)
    changed_by = db.Column(db.String(100), default='Recruiter')
    note = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        return {
            'id': self.id,
            'candidate_id': self.candidate_id,
            'application_id': self.application_id,
            'old_status': self.old_status,
            'new_status': self.new_status,
            'changed_by': self.changed_by,
            'note': self.note,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
