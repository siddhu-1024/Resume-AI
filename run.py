import os
import sys
import logging

# Ensure project root and venv site-packages are on Python module search path
project_root = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, project_root)
for venv_name in ['.venv_new', '.venv']:
    v_site = os.path.join(project_root, venv_name, 'Lib', 'site-packages')
    if os.path.exists(v_site) and v_site not in sys.path:
        sys.path.insert(0, v_site)

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
