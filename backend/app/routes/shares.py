from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.models import Document, DocumentShare, User, generate_uuid
from app.services.audit_service import AuditService
from app.utils.decorators import auth_required, get_current_user

shares_bp = Blueprint('shares', __name__)

@shares_bp.route('/api/documents/<doc_id>/share', methods=['POST'])
@auth_required
def share_document(doc_id):
    current_user = get_current_user()
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    permission = (data.get('permission') or 'viewer').strip().lower()

    if not email:
        return jsonify({'success': False, 'message': 'Recipient email is required.'}), 400

    if permission not in {'viewer', 'editor'}:
        return jsonify({'success': False, 'message': 'Permission must be either "viewer" or "editor".'}), 400

    doc = Document.query.filter_by(id=doc_id, is_deleted=0).first()
    if not doc:
        return jsonify({'success': False, 'message': 'Document not found.'}), 404

    # Multi-tenant boundary
    if doc.organization_id != current_user.organization_id:
        return jsonify({'success': False, 'message': 'Cross-tenant access prohibited.'}), 403

    # RBAC: Only owner or admin can share
    if doc.owner_id != current_user.id and current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Access denied: Only document owner can share this document.'}), 403

    recipient = User.query.filter_by(email=email).first()
    if not recipient:
        return jsonify({'success': False, 'message': f'User with email "{email}" was not found. They must register first.'}), 404

    # Enforce tenant isolation on recipient: cannot share outside organization!
    if recipient.organization_id != current_user.organization_id:
        return jsonify({
            'success': False,
            'message': 'Cross-tenant sharing prohibited: Recipient belongs to a different organization.'
        }), 403

    if recipient.id == current_user.id:
        return jsonify({'success': False, 'message': 'You cannot share a document with yourself.'}), 400

    existing_share = DocumentShare.query.filter_by(document_id=doc_id, shared_with=recipient.id).first()

    action_taken = 'DOCUMENT_SHARED'
    prev_permission = None

    if existing_share:
        action_taken = 'ACCESS_PERMISSION_CHANGED'
        prev_permission = existing_share.permission
        existing_share.permission = permission
        share_id = existing_share.id
    else:
        share_id = generate_uuid()
        new_share = DocumentShare(
            id=share_id,
            document_id=doc_id,
            shared_by=current_user.id,
            shared_with=recipient.id,
            permission=permission
        )
        db.session.add(new_share)

    db.session.commit()

    AuditService.log_event(
        action=action_taken,
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        user_email=current_user.email,
        document_id=doc.id,
        document_name=doc.title,
        details={
            'recipientId': recipient.id,
            'recipientEmail': recipient.email,
            'recipientName': recipient.full_name,
            'permission': permission,
            'previousPermission': prev_permission
        },
        ip_address=request.remote_addr or '127.0.0.1'
    )

    return jsonify({
        'success': True,
        'message': f'Document successfully shared with {recipient.full_name} ({recipient.email}) as {permission}.',
        'share': {
            'id': share_id,
            'documentId': doc_id,
            'permission': permission,
            'recipient': recipient.to_dict()
        }
    }), 200

@shares_bp.route('/api/shares', methods=['GET'])
@auth_required
def get_shares():
    current_user = get_current_user()
    doc_id = request.args.get('documentId')

    query = DocumentShare.query.join(Document).filter(
        Document.organization_id == current_user.organization_id,
        Document.is_deleted == 0
    )

    if doc_id:
        query = query.filter(DocumentShare.document_id == doc_id)
        if current_user.role != 'admin':
            query = query.filter(
                (Document.owner_id == current_user.id) | (DocumentShare.shared_with == current_user.id)
            )
    else:
        if current_user.role != 'admin':
            query = query.filter(
                (Document.owner_id == current_user.id) | (DocumentShare.shared_with == current_user.id)
            )

    shares = query.order_by(DocumentShare.created_at.desc()).all()

    return jsonify({
        'success': True,
        'shares': [s.to_dict() for s in shares]
    }), 200

@shares_bp.route('/api/shares/<share_id>', methods=['DELETE'])
@auth_required
def revoke_share(share_id):
    current_user = get_current_user()
    share = db.session.get(DocumentShare, share_id)

    if not share:
        return jsonify({'success': False, 'message': 'Share record not found.'}), 404

    doc = share.document
    if doc.organization_id != current_user.organization_id:
        return jsonify({'success': False, 'message': 'Cross-tenant access prohibited.'}), 403

    # Authorization: Owner, Admin, or recipient resigning access
    if doc.owner_id != current_user.id and share.shared_with != current_user.id and current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Access denied: You do not have permission to revoke this share.'}), 403

    recipient_email = share.recipient.email if share.recipient else 'Unknown'
    recipient_name = share.recipient.full_name if share.recipient else 'Unknown'

    db.session.delete(share)
    db.session.commit()

    AuditService.log_event(
        action='ACCESS_REVOKED',
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        user_email=current_user.email,
        document_id=doc.id,
        document_name=doc.title,
        details={
            'revokedRecipientId': share.shared_with,
            'revokedRecipientEmail': recipient_email,
            'previousPermission': share.permission
        },
        ip_address=request.remote_addr or '127.0.0.1'
    )

    return jsonify({
        'success': True,
        'message': f"Access revoked for {recipient_name} ({recipient_email})."
    }), 200
