import os
from flask import Blueprint, request, jsonify, send_file
from app.extensions import db
from app.models.models import Document, DocumentVersion, VerificationRecord, DocumentShare, generate_uuid
from app.services.hash_service import HashService
from app.services.storage_service import storage_service
from app.services.audit_service import AuditService
from app.utils.decorators import auth_required, admin_required, get_current_user
from app.utils.validators import is_allowed_file, generate_vault_filename

documents_bp = Blueprint('documents', __name__, url_prefix='/api/documents')

@documents_bp.route('/upload', methods=['POST'])
@auth_required
def upload_document():
    current_user = get_current_user()

    # RBAC check: Viewers cannot upload documents
    if current_user.role == 'viewer':
        return jsonify({
            'success': False,
            'message': 'Access denied: Viewers are not permitted to upload documents.'
        }), 403

    if 'file' not in request.files:
        return jsonify({
            'success': False,
            'message': 'No file uploaded. Please select a valid document.'
        }), 400

    file = request.files['file']
    if not file or not file.filename:
        return jsonify({
            'success': False,
            'message': 'No file selected.'
        }), 400

    title = (request.form.get('title') or '').strip()
    description = (request.form.get('description') or '').strip()

    if not title:
        return jsonify({
            'success': False,
            'message': 'Document title is required.'
        }), 400

    allowed, err_msg = is_allowed_file(file.filename, file.content_type)
    if not allowed:
        return jsonify({
            'success': False,
            'message': err_msg
        }), 400

    storage_service.init_directories()

    stored_filename, ext = generate_vault_filename(file.filename)
    vault_file_path = storage_service.get_vault_file_path(stored_filename)

    file.save(vault_file_path)
    file_size = os.path.getsize(vault_file_path)

    # 1. Immediate SHA-256 calculation
    file_hash = HashService.calculate_file_hash(vault_file_path)

    # 2. Pristine backup creation for tamper simulation
    storage_service.create_backup_copy(stored_filename)

    doc_id = generate_uuid()
    version_id = generate_uuid()

    doc = Document(
        id=doc_id,
        organization_id=current_user.organization_id,
        owner_id=current_user.id,
        title=title,
        description=description,
        original_filename=file.filename,
        stored_filename=stored_filename,
        file_path=vault_file_path,
        file_size=file_size,
        mime_type=file.content_type or 'application/octet-stream',
        file_extension=ext,
        current_version=1,
        is_deleted=0
    )

    doc_version = DocumentVersion(
        id=version_id,
        document_id=doc_id,
        version_number=1,
        stored_filename=stored_filename,
        file_path=vault_file_path,
        file_size=file_size,
        sha256_hash=file_hash,
        uploaded_by=current_user.id,
        change_summary='Initial document upload'
    )

    initial_verification = VerificationRecord(
        id=generate_uuid(),
        document_id=doc_id,
        version_number=1,
        verified_by=current_user.id,
        original_hash=file_hash,
        recalculated_hash=file_hash,
        status='VERIFIED',
        verification_message='Initial upload verification: SHA-256 hash cataloged successfully.'
    )

    db.session.add(doc)
    db.session.add(doc_version)
    db.session.add(initial_verification)
    db.session.commit()

    # 3. Hash-chained audit logging
    AuditService.log_event(
        action='DOCUMENT_UPLOADED',
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        user_email=current_user.email,
        document_id=doc_id,
        document_name=title,
        details={
            'originalFilename': file.filename,
            'fileSize': file_size,
            'mimeType': file.content_type,
            'sha256Hash': file_hash,
            'version': 1
        },
        ip_address=request.remote_addr or '127.0.0.1'
    )

    return jsonify({
        'success': True,
        'message': 'Document uploaded and cryptographically indexed with SHA-256 hash.',
        'document': doc.to_dict(current_user_id=current_user.id),
        'sha256Hash': file_hash
    }), 201

@documents_bp.route('', methods=['GET'])
@auth_required
def get_documents():
    current_user = get_current_user()
    search = (request.args.get('search') or '').strip()
    extension = request.args.get('extension')
    status = request.args.get('status')
    tab_filter = request.args.get('filter')  # 'owned' or 'shared'

    # Multi-tenant isolation: documents must match caller's organization
    query = Document.query.filter_by(
        organization_id=current_user.organization_id,
        is_deleted=0
    )

    # Permission scoping
    if current_user.role == 'admin':
        # Admin can view all documents in their organization
        if tab_filter == 'owned':
            query = query.filter_by(owner_id=current_user.id)
        elif tab_filter == 'shared':
            query = query.join(DocumentShare).filter(DocumentShare.shared_with == current_user.id)
    else:
        # Ordinary users can only access documents they own OR were shared with
        if tab_filter == 'owned':
            query = query.filter_by(owner_id=current_user.id)
        elif tab_filter == 'shared':
            query = query.join(DocumentShare).filter(DocumentShare.shared_with == current_user.id)
        else:
            query = query.filter(
                (Document.owner_id == current_user.id) |
                (Document.shares.any(DocumentShare.shared_with == current_user.id))
            )

    if search:
        query = query.filter(
            (Document.title.ilike(f"%{search}%")) |
            (Document.original_filename.ilike(f"%{search}%"))
        )

    if extension and extension != 'all':
        query = query.filter(Document.file_extension == extension.lower())

    docs = query.order_by(Document.created_at.desc()).all()

    # Status filter in Python
    filtered_docs = []
    for d in docs:
        doc_dict = d.to_dict(current_user_id=current_user.id)
        if status and status != 'all':
            if doc_dict.get('latest_verification_status') != status.upper():
                continue
        filtered_docs.append(doc_dict)

    return jsonify({
        'success': True,
        'documents': filtered_docs,
        'count': len(filtered_docs)
    }), 200

@documents_bp.route('/<doc_id>', methods=['GET'])
@auth_required
def get_document_by_id(doc_id):
    current_user = get_current_user()
    doc = Document.query.filter_by(id=doc_id, is_deleted=0).first()

    if not doc:
        return jsonify({'success': False, 'message': 'Document not found or deleted.'}), 404

    # Enforce strict multi-tenant boundary
    if doc.organization_id != current_user.organization_id:
        return jsonify({
            'success': False,
            'message': 'Cross-tenant access prohibited.'
        }), 403

    is_owner = (doc.owner_id == current_user.id)
    share = DocumentShare.query.filter_by(document_id=doc_id, shared_with=current_user.id).first()
    is_admin = (current_user.role == 'admin')

    if not is_owner and not share and not is_admin:
        return jsonify({
            'success': False,
            'message': 'Access denied: You do not have permission to view this document.'
        }), 403

    doc_dict = doc.to_dict(current_user_id=current_user.id)

    shares = [s.to_dict() for s in doc.shares]
    verification_history = [v.to_dict() for v in doc.verifications[:10]]
    audit_trail = [
        a.to_dict() for a in doc.organization.audit_logs 
        if a.document_id == doc_id
    ][:20]

    return jsonify({
        'success': True,
        'document': doc_dict,
        'shares': shares,
        'verificationHistory': verification_history,
        'auditTrail': audit_trail
    }), 200

@documents_bp.route('/<doc_id>/download', methods=['GET'])
@auth_required
def download_document(doc_id):
    current_user = get_current_user()
    doc = Document.query.filter_by(id=doc_id, is_deleted=0).first()

    if not doc:
        return jsonify({'success': False, 'message': 'Document not found.'}), 404

    # Tenant check
    if doc.organization_id != current_user.organization_id:
        return jsonify({'success': False, 'message': 'Cross-tenant access prohibited.'}), 403

    is_owner = (doc.owner_id == current_user.id)
    share = DocumentShare.query.filter_by(document_id=doc_id, shared_with=current_user.id).first()
    is_admin = (current_user.role == 'admin')

    # RBAC check: Owner, Admin, or shared recipient with viewer/editor permission
    if not is_owner and not share and not is_admin:
        return jsonify({
            'success': False,
            'message': 'Access denied: You do not have permission to download this document.'
        }), 403

    file_path = storage_service.get_vault_file_path(doc.stored_filename)
    if not os.path.exists(file_path):
        return jsonify({
            'success': False,
            'message': 'Physical file missing from vault storage.'
        }), 404

    role_desc = 'OWNER' if is_owner else (share.permission.upper() if share else 'ADMIN')

    AuditService.log_event(
        action='DOCUMENT_DOWNLOADED',
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        user_email=current_user.email,
        document_id=doc.id,
        document_name=doc.title,
        details={'originalFilename': doc.original_filename, 'downloadedAs': role_desc},
        ip_address=request.remote_addr or '127.0.0.1'
    )

    return send_file(
        file_path,
        as_attachment=True,
        download_name=doc.original_filename,
        mimetype=doc.mime_type
    )

@documents_bp.route('/<doc_id>/verify', methods=['POST'])
@auth_required
def verify_document(doc_id):
    """
    Core Cryptographic Feature: SHA-256 Bitstream Integrity Verification
    """
    current_user = get_current_user()
    doc = Document.query.filter_by(id=doc_id, is_deleted=0).first()

    if not doc:
        return jsonify({'success': False, 'message': 'Document not found.'}), 404

    if doc.organization_id != current_user.organization_id:
        return jsonify({'success': False, 'message': 'Cross-tenant access prohibited.'}), 403

    is_owner = (doc.owner_id == current_user.id)
    share = DocumentShare.query.filter_by(document_id=doc_id, shared_with=current_user.id).first()
    is_admin = (current_user.role == 'admin')

    if not is_owner and not share and not is_admin:
        return jsonify({
            'success': False,
            'message': 'Access denied: You do not have permission to verify this document.'
        }), 403

    file_path = storage_service.get_vault_file_path(doc.stored_filename)
    if not os.path.exists(file_path):
        return jsonify({
            'success': False,
            'message': 'Physical file missing from storage disk.'
        }), 404

    latest_version = doc.versions[0] if doc.versions else None
    if not latest_version:
        return jsonify({'success': False, 'message': 'Document version record missing.'}), 500

    baseline_hash = latest_version.sha256_hash
    verification_res = HashService.verify_file_integrity(file_path, baseline_hash)

    status = 'VERIFIED' if verification_res['match'] else 'TAMPER_DETECTED'
    explanation = (
        'VERIFIED: The document is authentic and unmodified. The SHA-256 cryptographic digest of the physical '
        'file on disk matches the original baseline hash bit-for-bit.'
        if verification_res['match'] else
        'TAMPER DETECTED: The physical file stored in the vault has been altered or corrupted since upload! '
        'Its current SHA-256 digest does not match the cataloged original hash.'
    )

    verification_rec = VerificationRecord(
        id=generate_uuid(),
        document_id=doc.id,
        version_number=doc.current_version,
        verified_by=current_user.id,
        original_hash=baseline_hash,
        recalculated_hash=verification_res['recalculatedHash'],
        status=status,
        verification_message=explanation
    )
    db.session.add(verification_rec)
    db.session.commit()

    # Append to hash-chained audit ledger
    AuditService.log_event(
        action='DOCUMENT_VERIFIED',
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        user_email=current_user.email,
        document_id=doc.id,
        document_name=doc.title,
        details={
            'status': status,
            'match': verification_res['match'],
            'originalHash': baseline_hash,
            'recalculatedHash': verification_res['recalculatedHash'],
            'explanation': explanation
        },
        ip_address=request.remote_addr or '127.0.0.1'
    )

    return jsonify({
        'success': True,
        'status': status,
        'match': verification_res['match'],
        'originalHash': baseline_hash,
        'currentHash': verification_res['recalculatedHash'],
        'verifiedAt': verification_rec.verified_at.isoformat(),
        'verifiedBy': current_user.full_name,
        'explanation': explanation
    }), 200

@documents_bp.route('/<doc_id>', methods=['DELETE'])
@auth_required
def delete_document(doc_id):
    current_user = get_current_user()
    doc = Document.query.filter_by(id=doc_id, is_deleted=0).first()

    if not doc:
        return jsonify({'success': False, 'message': 'Document not found.'}), 404

    if doc.organization_id != current_user.organization_id:
        return jsonify({'success': False, 'message': 'Cross-tenant access prohibited.'}), 403

    # RBAC: Only Owner or Admin can delete
    if doc.owner_id != current_user.id and current_user.role != 'admin':
        return jsonify({
            'success': False,
            'message': 'Access denied: Only document owner or tenant administrator can delete this document.'
        }), 403

    doc.is_deleted = 1
    db.session.commit()

    AuditService.log_event(
        action='DOCUMENT_DELETED',
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        user_email=current_user.email,
        document_id=doc.id,
        document_name=doc.title,
        details={'originalFilename': doc.original_filename},
        ip_address=request.remote_addr or '127.0.0.1'
    )

    return jsonify({
        'success': True,
        'message': 'Document deleted successfully.'
    }), 200

@documents_bp.route('/<doc_id>/simulate-tamper', methods=['POST'])
@auth_required
@admin_required
def simulate_tamper(doc_id):
    """
    Adversarial Tamper Simulation Lab (Admin Only)
    Corrupts file byte-stream on disk to evaluate tamper detection engine.
    """
    current_user = get_current_user()
    doc = Document.query.filter_by(id=doc_id, is_deleted=0).first()

    if not doc:
        return jsonify({'success': False, 'message': 'Document not found.'}), 404

    if doc.organization_id != current_user.organization_id:
        return jsonify({'success': False, 'message': 'Cross-tenant access prohibited.'}), 403

    result = storage_service.simulate_file_tamper(doc.stored_filename)

    AuditService.log_event(
        action='TAMPER_SIMULATED',
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        user_email=current_user.email,
        document_id=doc.id,
        document_name=doc.title,
        details={'reason': 'Manual evaluation test: byte corruption payload injected on disk.'},
        ip_address=request.remote_addr or '127.0.0.1'
    )

    return jsonify({
        'success': True,
        'message': 'Tampering simulated successfully! The physical file on disk was modified. Run "Verify Document" to see SHA-256 mismatch detected.',
        'details': result
    }), 200

@documents_bp.route('/<doc_id>/restore-tamper', methods=['POST'])
@auth_required
@admin_required
def restore_tamper(doc_id):
    """
    Restores pristine snapshot after tamper simulation (Admin Only).
    """
    current_user = get_current_user()
    doc = Document.query.filter_by(id=doc_id, is_deleted=0).first()

    if not doc:
        return jsonify({'success': False, 'message': 'Document not found.'}), 404

    if doc.organization_id != current_user.organization_id:
        return jsonify({'success': False, 'message': 'Cross-tenant access prohibited.'}), 403

    result = storage_service.restore_original_file(doc.stored_filename)

    AuditService.log_event(
        action='FILE_RESTORED',
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        user_email=current_user.email,
        document_id=doc.id,
        document_name=doc.title,
        details={'reason': 'Restored original pristine file after tamper test.'},
        ip_address=request.remote_addr or '127.0.0.1'
    )

    return jsonify({
        'success': True,
        'message': 'Original document file restored! Run "Verify Document" to confirm hash verification passes.',
        'details': result
    }), 200
