import json
from datetime import datetime, timezone
from backend.app.database import db, BaseModel

class Setting(BaseModel):
    __tablename__ = 'settings'
    
    key = db.Column(db.String(100), primary_key=True)
    value = db.Column(db.Text, nullable=False)
    description = db.Column(db.String(255), default='')
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    @staticmethod
    def get_val(key, default=None):
        item = db.session.get(Setting, key)
        if not item:
            return default
        try:
            return json.loads(item.value)
        except Exception:
            return item.value
            
    @staticmethod
    def set_val(key, val, description=''):
        item = db.session.get(Setting, key)
        val_str = json.dumps(val) if not isinstance(val, str) else val
        if not item:
            item = Setting(key=key, value=val_str, description=description)
            db.session.add(item)
        else:
            item.value = val_str
            if description:
                item.description = description
        db.session.commit()
        return item


class ActivityLog(BaseModel):
    __tablename__ = 'activity_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    event_type = db.Column(db.String(50), nullable=False)  # job_created, resume_uploaded, screening_completed, status_changed, note_added, report_generated
    description = db.Column(db.Text, nullable=False)
    entity_type = db.Column(db.String(50), default='')     # job, candidate, report
    entity_id = db.Column(db.Integer, nullable=True)
    metadata_json = db.Column(db.Text, default='{}')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        meta = {}
        try:
            if self.metadata_json:
                meta = json.loads(self.metadata_json)
        except Exception:
            pass
            
        return {
            'id': self.id,
            'event_type': self.event_type,
            'description': self.description,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'metadata': meta,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
