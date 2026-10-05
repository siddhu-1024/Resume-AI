import os
import hashlib
import re
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {'pdf', 'docx'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16 MB

def allowed_file(filename):
    if not filename or '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in ALLOWED_EXTENSIONS

def sanitize_filename(filename):
    cleaned = secure_filename(filename)
    if not cleaned:
        cleaned = f"resume_{hashlib.md5(filename.encode('utf-8', errors='ignore')).hexdigest()[:8]}.pdf"
    return cleaned

def compute_file_hash(file_bytes_or_path):
    sha256 = hashlib.sha256()
    if isinstance(file_bytes_or_path, (bytes, bytearray)):
        sha256.update(file_bytes_or_path)
    elif os.path.exists(file_bytes_or_path):
        with open(file_bytes_or_path, 'rb') as f:
            for chunk in iter(lambda: f.read(65536), b''):
                sha256.update(chunk)
    return sha256.hexdigest()

def validate_resume_file(file_storage):
    """
    Validates uploaded file object. Returns (is_valid, error_message, file_type, file_bytes).
    """
    if not file_storage or not file_storage.filename:
        return False, "No file selected.", None, None
        
    filename = file_storage.filename
    if not allowed_file(filename):
        return False, "Invalid file format. Only PDF and DOCX files are supported.", None, None
        
    ext = filename.rsplit('.', 1)[1].lower()
    
    # Read content
    file_bytes = file_storage.read()
    file_size = len(file_bytes)
    file_storage.seek(0)  # Reset pointer
    
    if file_size == 0:
        return False, "The uploaded file is empty (0 bytes).", ext, None
        
    if file_size > MAX_FILE_SIZE:
        return False, f"File size exceeds {MAX_FILE_SIZE // (1024 * 1024)}MB limit.", ext, None
        
    # Magic bytes check
    if ext == 'pdf':
        if not file_bytes.startswith(b'%PDF'):
            # Some PDFs have slight leading whitespace, check first 32 bytes
            if b'%PDF' not in file_bytes[:64]:
                return False, "Invalid PDF header. File appears corrupt or malformed.", ext, None
    elif ext == 'docx':
        # ZIP magic bytes for standard docx (PK..)
        if not file_bytes.startswith(b'PK\x03\x04'):
            return False, "Invalid DOCX format. File appears corrupt or malformed.", ext, None
            
    return True, None, ext, file_bytes
