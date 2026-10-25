import os
import re
import uuid
from flask import current_app
from werkzeug.utils import secure_filename

def validate_email(email: str) -> bool:
    if not email:
        return False
    pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    return bool(re.match(pattern, email.strip()))

def is_allowed_file(filename: str, content_type: str = None) -> tuple[bool, str]:
    if not filename or '.' not in filename:
        return False, "File must have an extension."

    ext = os.path.splitext(filename)[1].lower()
    allowed_exts = current_app.config.get('ALLOWED_EXTENSIONS', {'.pdf', '.docx', '.txt', '.png', '.jpg', '.jpeg'})
    
    if ext not in allowed_exts:
        return False, f"File extension '{ext}' is not permitted. Allowed: {', '.join(sorted(allowed_exts))}"

    if content_type:
        allowed_mimes = current_app.config.get('ALLOWED_MIME_TYPES', set())
        # If MIME types configured and content_type provided, verify
        if allowed_mimes and content_type.lower() not in allowed_mimes:
            return False, f"File MIME type '{content_type}' is not supported."

    return True, ""

def generate_vault_filename(original_filename: str) -> tuple[str, str]:
    """
    Generates a collision-free, path-traversal-proof filename.
    Returns: (stored_filename, file_extension)
    """
    ext = os.path.splitext(original_filename)[1].lower()
    unique_id = uuid.uuid4().hex
    safe_base = secure_filename(os.path.splitext(original_filename)[0])
    safe_base = re.sub(r'[^a-zA-Z0-9_-]', '_', safe_base)[:30]
    stored_filename = f"doc_{unique_id}_{safe_base}{ext}"
    return stored_filename, ext
