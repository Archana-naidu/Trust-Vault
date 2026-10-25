import os
from datetime import timedelta
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(BASE_DIR, '.env'))

db_dir = os.path.join(BASE_DIR, 'database')
os.makedirs(db_dir, exist_ok=True)
db_file = os.path.join(db_dir, 'trustvault.db')
default_db_uri = f"sqlite:///{db_file.replace(os.sep, '/')}"

raw_db_url = os.getenv('DATABASE_URL')
if raw_db_url and raw_db_url.startswith('sqlite:///') and not raw_db_url.startswith('sqlite:////'):
    rel_path = raw_db_url.replace('sqlite:///', '')
    if not os.path.isabs(rel_path):
        resolved = os.path.abspath(os.path.join(BASE_DIR, rel_path))
        os.makedirs(os.path.dirname(resolved), exist_ok=True)
        final_db_uri = f"sqlite:///{resolved.replace(os.sep, '/')}"
    else:
        final_db_uri = f"sqlite:///{rel_path.replace(os.sep, '/')}"
elif raw_db_url:
    final_db_uri = raw_db_url
else:
    final_db_uri = default_db_uri

class Config:
    BASE_DIR = BASE_DIR
    SECRET_KEY = os.getenv('SECRET_KEY', 'trustvault_super_secret_flask_key_2025_secure_entropy')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET', 'trustvault_super_secret_jwt_key_2025_secure_entropy_at_least_32_bytes_long')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # SQLite Database URI with WAL mode compatibility
    SQLALCHEMY_DATABASE_URI = final_db_uri
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'connect_args': {'check_same_thread': False, 'timeout': 30}
    }

    # Uploads & Storage
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads', 'vault')
    BACKUP_FOLDER = os.path.join(BASE_DIR, 'uploads', 'backup')
    MAX_CONTENT_LENGTH = 15 * 1024 * 1024  # 15 MB
    
    ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.txt', '.png', '.jpg', '.jpeg'}
    ALLOWED_MIME_TYPES = {
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'application/octet-stream'
    }

    # Cryptographic Baseline Genesis Hash for Tamper-Evident Audit Chain
    GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000'

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads', 'test_vault')
    BACKUP_FOLDER = os.path.join(BASE_DIR, 'uploads', 'test_backup')
