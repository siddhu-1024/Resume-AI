import json
from datetime import datetime, timezone
from backend.app.database import db, BaseModel

class Job(BaseModel):
    __tablename__ = 'jobs'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    department = db.Column(db.String(100), default='General')
    location = db.Column(db.String(150), default='Remote')
    employment_type = db.Column(db.String(50), default='Full-time')
    min_experience_years = db.Column(db.Float, default=0.0)
    education_level = db.Column(db.String(100), default="Bachelor's Degree")
    salary_range = db.Column(db.String(100), default='')
    status = db.Column(db.String(30), default='Active')  # Draft, Active, Closed, Archived
    
    raw_description = db.Column(db.Text, nullable=False, default='')
    responsibilities_text = db.Column(db.Text, default='')
    qualifications_text = db.Column(db.Text, default='')
    
    # Serialized JSON lists
    required_skills = db.Column(db.Text, default='[]')
    preferred_skills = db.Column(db.Text, default='[]')
    extracted_keywords = db.Column(db.Text, default='[]')
    extracted_data_json = db.Column(db.Text, default='{}')
    
    is_demo = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    applications = db.relationship('Application', backref='job', cascade='all, delete-orphan', lazy=True)
    requirements = db.relationship('JobRequirement', backref='job', cascade='all, delete-orphan', lazy=True)
    candidates = db.relationship('Candidate', backref='job', cascade='all, delete-orphan', lazy=True)
    screening_results = db.relationship('ScreeningResult', backref='job', cascade='all, delete-orphan', lazy=True)
    
    def get_required_skills(self):
        try:
            return json.loads(self.required_skills) if self.required_skills else []
        except Exception:
            return []
            
    def get_preferred_skills(self):
        try:
            return json.loads(self.preferred_skills) if self.preferred_skills else []
        except Exception:
            return []
            
    def get_extracted_keywords(self):
        try:
            return json.loads(self.extracted_keywords) if self.extracted_keywords else []
        except Exception:
            return []
            
    def get_extracted_data(self):
        try:
            return json.loads(self.extracted_data_json) if self.extracted_data_json else {}
        except Exception:
            return {}

    def to_dict(self, include_candidates_count=True):
        data = {
            'id': self.id,
            'title': self.title,
            'department': self.department,
            'location': self.location,
            'employment_type': self.employment_type,
            'min_experience_years': self.min_experience_years,
            'education_level': self.education_level,
            'salary_range': self.salary_range,
            'status': self.status,
            'raw_description': self.raw_description,
            'responsibilities_text': self.responsibilities_text,
            'qualifications_text': self.qualifications_text,
            'required_skills': self.get_required_skills(),
            'preferred_skills': self.get_preferred_skills(),
            'extracted_keywords': self.get_extracted_keywords(),
            'extracted_data': self.get_extracted_data(),
            'is_demo': self.is_demo,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_candidates_count:
            data['candidates_count'] = len(self.candidates)
            data['screened_count'] = len(self.screening_results)
            data['requirements_count'] = len(self.requirements)
        return data


class JobRequirement(BaseModel):
    __tablename__ = 'job_requirements'
    
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # required_skill, preferred_skill, experience, education, technical, responsibility, certification
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, default='')
    weight = db.Column(db.Float, default=1.0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        return {
            'id': self.id,
            'job_id': self.job_id,
            'category': self.category,
            'title': self.title,
            'description': self.description,
            'weight': self.weight,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
