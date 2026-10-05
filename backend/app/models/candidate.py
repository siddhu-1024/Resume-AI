import json
from datetime import datetime, timezone
from backend.app.database import db, BaseModel

class Candidate(BaseModel):
    __tablename__ = 'candidates'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=True)
    
    full_name = db.Column(db.String(200), nullable=False, default='Unknown Candidate')
    email = db.Column(db.String(150), default='')
    phone = db.Column(db.String(50), default='')
    location = db.Column(db.String(150), default='')
    
    linkedin_url = db.Column(db.String(255), default='')
    github_url = db.Column(db.String(255), default='')
    portfolio_url = db.Column(db.String(255), default='')
    
    professional_summary = db.Column(db.Text, default='')
    total_experience_years = db.Column(db.Float, default=0.0)
    highest_education = db.Column(db.String(150), default='')
    
    # Status: 'Applied', 'Under Review', 'Shortlisted', 'Interview', 'Rejected', 'Selected'
    status = db.Column(db.String(50), default='Applied')
    is_demo = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    applications = db.relationship('Application', backref='candidate', cascade='all, delete-orphan', lazy=True)
    resume = db.relationship('Resume', backref='candidate', foreign_keys='Resume.candidate_id', uselist=False, cascade='all, delete-orphan', lazy=True)
    skills = db.relationship('CandidateSkill', backref='candidate', cascade='all, delete-orphan', lazy=True)
    experiences = db.relationship('Experience', backref='candidate', cascade='all, delete-orphan', lazy=True)
    education = db.relationship('Education', backref='candidate', cascade='all, delete-orphan', lazy=True)
    projects = db.relationship('Project', backref='candidate', cascade='all, delete-orphan', lazy=True)
    certifications = db.relationship('Certification', backref='candidate', cascade='all, delete-orphan', lazy=True)
    screening_results = db.relationship('ScreeningResult', backref='candidate', cascade='all, delete-orphan', lazy=True)
    notes = db.relationship('CandidateNote', backref='candidate', cascade='all, delete-orphan', order_by='CandidateNote.created_at.desc()', lazy=True)
    status_history = db.relationship('StatusHistory', backref='candidate', cascade='all, delete-orphan', order_by='StatusHistory.created_at.desc()', lazy=True)

    def to_dict(self, include_details=False, is_admin=False):
        latest_screening = self.screening_results[-1] if self.screening_results else None
        
        data = {
            'id': self.id,
            'job_id': self.job_id,
            'job_title': self.job.title if self.job else 'Unassigned',
            'full_name': self.full_name,
            'email': self.email or 'Not detected',
            'phone': self.phone or 'Not detected',
            'location': self.location or 'Not detected',
            'linkedin_url': self.linkedin_url or '',
            'github_url': self.github_url or '',
            'portfolio_url': self.portfolio_url or '',
            'professional_summary': self.professional_summary or 'Not detected',
            'total_experience_years': round(self.total_experience_years, 1),
            'highest_education': self.highest_education or 'Not detected',
            'status': self.status,
            'is_demo': self.is_demo,
            'resume_filename': self.resume.filename if self.resume else None,
            'resume_file_type': self.resume.file_type if self.resume else None,
            'has_resume': self.resume is not None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'top_skills': [s.name for s in self.skills[:8]],
            'skills_count': len(self.skills),
            'latest_match_score': round(latest_screening.overall_match_score, 1) if latest_screening else None,
            'latest_screened_at': latest_screening.screened_at.isoformat() if latest_screening and latest_screening.screened_at else None,
        }
        
        if include_details:
            data.update({
                'skills': [s.to_dict() for s in self.skills],
                'technical_skills': [s.name for s in self.skills if s.category == 'technical'],
                'soft_skills': [s.name for s in self.skills if s.category == 'soft'],
                'experiences': [e.to_dict() for e in self.experiences],
                'education': [ed.to_dict() for ed in self.education],
                'projects': [p.to_dict() for p in self.projects],
                'certifications': [c.to_dict() for c in self.certifications],
                'screening': latest_screening.to_dict(include_matrix=True) if latest_screening else None,
            })
            if is_admin:
                data['notes'] = [n.to_dict() for n in self.notes]
                data['status_history'] = [sh.to_dict() for sh in self.status_history]
            
        return data


class Resume(BaseModel):
    __tablename__ = 'resumes'
    
    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id'), nullable=False)
    application_id = db.Column(db.Integer, nullable=True, index=True)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_type = db.Column(db.String(10), nullable=False)  # pdf, docx
    file_size_bytes = db.Column(db.Integer, default=0)
    file_hash = db.Column(db.String(64), index=True)  # SHA-256
    raw_text = db.Column(db.Text, default='')
    parsed_data_json = db.Column(db.Text, default='{}')
    parsing_status = db.Column(db.String(30), default='success')  # success, warning, failed
    parsing_error = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        return {
            'id': self.id,
            'candidate_id': self.candidate_id,
            'filename': self.filename,
            'file_type': self.file_type,
            'file_size_bytes': self.file_size_bytes,
            'parsing_status': self.parsing_status,
            'parsing_error': self.parsing_error,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class CandidateSkill(BaseModel):
    __tablename__ = 'candidate_skills'
    
    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), default='technical')  # technical, soft, domain, tool
    proficiency = db.Column(db.String(50), default='Detected')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'proficiency': self.proficiency
        }


class Experience(BaseModel):
    __tablename__ = 'experiences'
    
    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id'), nullable=False)
    job_title = db.Column(db.String(200), nullable=False, default='Role')
    company_name = db.Column(db.String(200), default='Company')
    location = db.Column(db.String(150), default='')
    start_date = db.Column(db.String(50), default='')
    end_date = db.Column(db.String(50), default='Present')
    is_current = db.Column(db.Boolean, default=False)
    duration_months = db.Column(db.Integer, default=0)
    description = db.Column(db.Text, default='')
    
    def to_dict(self):
        return {
            'id': self.id,
            'job_title': self.job_title,
            'company_name': self.company_name,
            'location': self.location,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'is_current': self.is_current,
            'duration_months': self.duration_months,
            'description': self.description
        }


class Education(BaseModel):
    __tablename__ = 'education'
    
    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id'), nullable=False)
    degree = db.Column(db.String(200), nullable=False, default='Degree')
    field_of_study = db.Column(db.String(200), default='')
    institution = db.Column(db.String(255), default='Institution')
    graduation_year = db.Column(db.String(50), default='')
    grade_or_gpa = db.Column(db.String(50), default='')
    
    def to_dict(self):
        return {
            'id': self.id,
            'degree': self.degree,
            'field_of_study': self.field_of_study,
            'institution': self.institution,
            'graduation_year': self.graduation_year,
            'grade_or_gpa': self.grade_or_gpa
        }


class Project(BaseModel):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, default='')
    technologies = db.Column(db.String(255), default='')
    url = db.Column(db.String(255), default='')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'technologies': self.technologies,
            'url': self.url
        }


class Certification(BaseModel):
    __tablename__ = 'certifications'
    
    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    issuing_organization = db.Column(db.String(255), default='')
    issue_date = db.Column(db.String(50), default='')
    credential_id = db.Column(db.String(100), default='')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'issuing_organization': self.issuing_organization,
            'issue_date': self.issue_date,
            'credential_id': self.credential_id
        }
