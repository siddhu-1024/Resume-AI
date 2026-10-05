import os
import sys
import logging

# Ensure project root is on Python module search path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from backend.app import create_app

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', '1') == '1'
    logger.info(f"Starting Resume Screening Assistant server on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
