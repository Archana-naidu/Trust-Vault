import uuid
import json
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db

def generate_uuid():
    return str(uuid.uuid4())

class Organization(db.Model):
    __tablename__ = 'organizations'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(120), nullable=False)
    slug = db.Column(db.String(120), unique=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    users = db.relationship('User', backref='organization', lazy=True, cascade='all, delete-orphan')
    documents = db.relationship('Document', backref='organization', lazy=True, cascade='all, delete-orphan')
    audit_logs = db.relationship('AuditLog', backref='organization', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='viewer') # 'admin', 'owner', 'editor', 'viewer'
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    owned_documents = db.relationship('Document', backref='owner', foreign_keys='Document.owner_id', lazy=True)
    sent_shares = db.relationship('DocumentShare', backref='sharer', foreign_keys='DocumentShare.shared_by', lazy=True)
    received_shares = db.relationship('DocumentShare', backref='recipient', foreign_keys='DocumentShare.shared_with', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'organization_id': self.organization_id,
            'organization_name': self.organization.name if self.organization else None,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Document(db.Model):
    __tablename__ = 'documents'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True)
    owner_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    original_filename = db.Column(db.String(255), nullable=False)
    stored_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    file_extension = db.Column(db.String(20), nullable=False)
    current_version = db.Column(db.Integer, default=1, nullable=False)
    is_deleted = db.Column(db.Integer, default=0, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    versions = db.relationship('DocumentVersion', backref='document', lazy=True, cascade='all, delete-orphan', order_by='DocumentVersion.version_number.desc()')
    shares = db.relationship('DocumentShare', backref='document', lazy=True, cascade='all, delete-orphan')
    verifications = db.relationship('VerificationRecord', backref='document', lazy=True, cascade='all, delete-orphan', order_by='VerificationRecord.verified_at.desc()')

    def to_dict(self, current_user_id=None):
        user_permission = None
        is_owner = (self.owner_id == current_user_id) if current_user_id else False
        
        if is_owner:
            user_permission = 'owner'
        elif current_user_id:
            share = next((s for s in self.shares if s.shared_with == current_user_id), None)
            if share:
                user_permission = share.permission

        latest_version = self.versions[0] if self.versions else None
        latest_verification = self.verifications[0] if self.verifications else None

        return {
            'id': self.id,
            'organization_id': self.organization_id,
            'organization_name': self.organization.name if self.organization else None,
            'owner_id': self.owner_id,
            'owner_name': self.owner.full_name if self.owner else None,
            'owner_email': self.owner.email if self.owner else None,
            'title': self.title,
            'description': self.description,
            'original_filename': self.original_filename,
            'stored_filename': self.stored_filename,
            'file_size': self.file_size,
            'mime_type': self.mime_type,
            'file_extension': self.file_extension,
            'current_version': self.current_version,
            'is_deleted': self.is_deleted,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'original_hash': latest_version.sha256_hash if latest_version else None,
            'user_permission': user_permission,
            'is_owner': 1 if is_owner else 0,
            'latest_verification_status': latest_verification.status if latest_verification else 'UNVERIFIED',
            'latest_verified_at': latest_verification.verified_at.isoformat() if latest_verification and latest_verification.verified_at else None,
            'latest_verified_hash': latest_verification.recalculated_hash if latest_verification else None
        }

class DocumentVersion(db.Model):
    __tablename__ = 'document_versions'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    document_id = db.Column(db.String(36), db.ForeignKey('documents.id', ondelete='CASCADE'), nullable=False, index=True)
    version_number = db.Column(db.Integer, nullable=False)
    stored_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    sha256_hash = db.Column(db.String(64), nullable=False)
    uploaded_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    change_summary = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        db.UniqueConstraint('document_id', 'version_number', name='uq_doc_version'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'document_id': self.document_id,
            'version_number': self.version_number,
            'stored_filename': self.stored_filename,
            'file_size': self.file_size,
            'sha256_hash': self.sha256_hash,
            'uploaded_by': self.uploaded_by,
            'change_summary': self.change_summary,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class DocumentShare(db.Model):
    __tablename__ = 'document_shares'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    document_id = db.Column(db.String(36), db.ForeignKey('documents.id', ondelete='CASCADE'), nullable=False, index=True)
    shared_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    shared_with = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    permission = db.Column(db.String(20), nullable=False)  # 'viewer' or 'editor'
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        db.UniqueConstraint('document_id', 'shared_with', name='uq_doc_share'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'document_id': self.document_id,
            'document_title': self.document.title if self.document else None,
            'original_filename': self.document.original_filename if self.document else None,
            'shared_by': self.shared_by,
            'sharer_id': self.shared_by,
            'sharer_name': self.sharer.full_name if self.sharer else None,
            'sharer_email': self.sharer.email if self.sharer else None,
            'shared_with': self.shared_with,
            'recipient_id': self.shared_with,
            'recipient_name': self.recipient.full_name if self.recipient else None,
            'recipient_email': self.recipient.email if self.recipient else None,
            'permission': self.permission,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class VerificationRecord(db.Model):
    __tablename__ = 'verification_records'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    document_id = db.Column(db.String(36), db.ForeignKey('documents.id', ondelete='CASCADE'), nullable=False, index=True)
    version_number = db.Column(db.Integer, nullable=False)
    verified_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    original_hash = db.Column(db.String(64), nullable=False)
    recalculated_hash = db.Column(db.String(64), nullable=False)
    status = db.Column(db.String(30), nullable=False)  # 'VERIFIED' or 'TAMPER_DETECTED'
    verification_message = db.Column(db.Text, nullable=False)
    verified_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    verifier = db.relationship('User', foreign_keys=[verified_by])

    def to_dict(self):
        return {
            'id': self.id,
            'document_id': self.document_id,
            'version_number': self.version_number,
            'verified_by': self.verified_by,
            'verified_by_name': self.verifier.full_name if self.verifier else None,
            'verified_by_email': self.verifier.email if self.verifier else None,
            'original_hash': self.original_hash,
            'recalculated_hash': self.recalculated_hash,
            'status': self.status,
            'verification_message': self.verification_message,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None
        }

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    event_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    sequence_num = db.Column(db.Integer, unique=True, nullable=False, index=True)
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id', ondelete='SET NULL'), nullable=True, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    user_email = db.Column(db.String(255), nullable=True)
    action = db.Column(db.String(100), nullable=False, index=True)
    document_id = db.Column(db.String(36), db.ForeignKey('documents.id', ondelete='SET NULL'), nullable=True, index=True)
    document_name = db.Column(db.String(255), nullable=True)
    details = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(100), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    previous_event_hash = db.Column(db.String(64), nullable=False)
    current_event_hash = db.Column(db.String(64), nullable=False)

    def to_dict(self):
        details_obj = None
        if self.details:
            try:
                details_obj = json.loads(self.details)
            except Exception:
                details_obj = self.details

        return {
            'id': self.id,
            'event_id': self.event_id,
            'sequence_num': self.sequence_num,
            'organization_id': self.organization_id,
            'user_id': self.user_id,
            'user_email': self.user_email,
            'action': self.action,
            'document_id': self.document_id,
            'document_name': self.document_name,
            'details': self.details,
            'detailsObj': details_obj,
            'ip_address': self.ip_address,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'previous_event_hash': self.previous_event_hash,
            'current_event_hash': self.current_event_hash
        }

class AuditTamperBackup(db.Model):
    __tablename__ = 'audit_tamper_backups'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    audit_log_id = db.Column(db.String(36), nullable=False)
    original_action = db.Column(db.String(100), nullable=False)
    original_details = db.Column(db.Text, nullable=True)
    original_hash = db.Column(db.String(64), nullable=False)
    tampered_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
