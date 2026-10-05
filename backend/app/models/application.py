import json
from datetime import datetime, timezone
from backend.app.database import db, BaseModel

class Application(BaseModel):
    __tablename__ = 'applications'
    
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id'), nullable=False)
    resume_id = db.Column(db.Integer, db.ForeignKey('resumes.id'), nullable=True)
    
    cover_letter = db.Column(db.Text, default='')
    # Statuses: 'Applied', 'Under Review', 'Shortlisted', 'Interview', 'Rejected', 'Selected'
    status = db.Column(db.String(50), nullable=False, default='Applied')
    match_score = db.Column(db.Float, default=0.0)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    resume = db.relationship('Resume', backref='application', foreign_keys=[resume_id], uselist=False, lazy=True)
    screening_results = db.relationship('ScreeningResult', backref='application', cascade='all, delete-orphan', lazy=True)
    notes = db.relationship('CandidateNote', backref='application', cascade='all, delete-orphan', order_by='CandidateNote.created_at.desc()', lazy=True)
    status_history = db.relationship('StatusHistory', backref='application', cascade='all, delete-orphan', order_by='StatusHistory.created_at.desc()', lazy=True)
    
    def to_dict(self, include_details=False, is_admin=False):
        latest_screening = self.screening_results[-1] if self.screening_results else (
            self.candidate.screening_results[-1] if (self.candidate and self.candidate.screening_results) else None
        )
        score = self.match_score
        if score == 0.0 and latest_screening:
            score = latest_screening.overall_match_score
            
        data = {
            'id': self.id,
            'job_id': self.job_id,
            'job_title': self.job.title if self.job else 'Unassigned Position',
            'job_department': self.job.department if self.job else 'General',
            'job_location': self.job.location if self.job else 'Remote',
            'job_employment_type': self.job.employment_type if self.job else 'Full-time',
            'user_id': self.user_id,
            'candidate_id': self.candidate_id,
            'candidate_name': self.candidate.full_name if self.candidate else 'Candidate',
            'candidate_email': self.candidate.email if self.candidate else '',
            'candidate_phone': self.candidate.phone if self.candidate else '',
            'candidate_location': self.candidate.location if self.candidate else '',
            'candidate_experience_years': round(self.candidate.total_experience_years, 1) if self.candidate else 0.0,
            'candidate_highest_education': self.candidate.highest_education if self.candidate else 'Not detected',
            'candidate_skills': [s.name for s in self.candidate.skills[:8]] if self.candidate else [],
            'status': self.status,
            'match_score': round(score, 1),
            'has_resume': self.resume is not None or (self.candidate and self.candidate.resume is not None),
            'resume_filename': self.resume.filename if self.resume else (self.candidate.resume.filename if (self.candidate and self.candidate.resume) else None),
            'resume_id': self.resume_id or (self.candidate.resume.id if (self.candidate and self.candidate.resume) else None),
            'cover_letter': self.cover_letter or '',
            'applied_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_details:
            # Candidate full profile
            if self.candidate:
                cand_dict = self.candidate.to_dict(include_details=True, is_admin=is_admin)
                data['candidate_details'] = cand_dict
                
            # Screening details (Transparent breakdown)
            if latest_screening:
                screening_dict = latest_screening.to_dict(include_matrix=True)
                if not is_admin:
                    # Filter out any internal notes/raw parameters from candidate view
                    screening_dict.pop('weights_used', None)
                data['screening'] = screening_dict
                
            # Internal admin notes (ONLY for Admin)
            if is_admin:
                data['notes'] = [n.to_dict() for n in self.notes]
                data['status_history'] = [sh.to_dict() for sh in self.status_history]
                
        return data
