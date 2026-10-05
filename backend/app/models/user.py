from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from backend.app.database import db, BaseModel

class User(BaseModel):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(30), nullable=False, default='candidate')  # 'admin' or 'candidate'
    phone = db.Column(db.String(50), default='')
    location = db.Column(db.String(150), default='')
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    applications = db.relationship('Application', backref='user', cascade='all, delete-orphan', lazy=True)
    candidate_profile = db.relationship('Candidate', backref='user', uselist=False, cascade='all, delete-orphan', lazy=True)
    
    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password: str) -> bool:
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)
        
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role,
            'phone': self.phone or '',
            'location': self.location or '',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
