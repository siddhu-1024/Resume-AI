import json
import logging
from backend.app.database import db
from backend.app.models.system import ActivityLog

logger = logging.getLogger('resume_screening')
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')

def log_activity(event_type, description, entity_type='', entity_id=None, metadata=None):
    """
    Logs an application activity to the database and standard logger.
    """
    try:
        logger.info(f"[{event_type.upper()}] {description}")
        meta_str = json.dumps(metadata or {})
        entry = ActivityLog(
            event_type=event_type,
            description=description,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata_json=meta_str
        )
        db.session.add(entry)
        db.session.commit()
        return entry
    except Exception as e:
        logger.error(f"Failed to record activity log: {e}")
        try:
            db.session.rollback()
        except Exception:
            pass
        return None
