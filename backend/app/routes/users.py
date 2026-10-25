from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.models import User
from app.services.audit_service import AuditService
from app.utils.decorators import auth_required, admin_required, get_current_user

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('', methods=['GET'])
@auth_required
@admin_required
def list_users():
    """
    Administrative listing of users within caller's organization.
    """
    current_user = get_current_user()
    users = User.query.filter_by(organization_id=current_user.organization_id).order_by(User.created_at.desc()).all()

    return jsonify({
        'success': True,
        'users': [u.to_dict() for u in users],
        'total': len(users)
    }), 200

@users_bp.route('/<user_id>/role', methods=['PATCH'])
@auth_required
@admin_required
def update_user_role(user_id):
    """
    Assign role (owner, editor, viewer, admin) to a user in the same tenant.
    """
    data = request.get_json(silent=True) or {}
    new_role = (data.get('role') or '').strip().lower()

    if new_role not in {'owner', 'editor', 'viewer', 'admin'}:
        return jsonify({
            'success': False,
            'message': 'Invalid role. Permitted: owner, editor, viewer, admin.'
        }), 400

    current_user = get_current_user()
    target_user = db.session.get(User, user_id)
    if not target_user:
        return jsonify({'success': False, 'message': 'User not found.'}), 404

    # Enforce tenant isolation
    if target_user.organization_id != current_user.organization_id:
        return jsonify({
            'success': False,
            'message': 'Forbidden: Cannot manage users from other organizations.'
        }), 403

    # Prevent admin from demoting themselves if they are the only admin
    if target_user.id == current_user.id and new_role != 'admin':
        admin_count = User.query.filter_by(organization_id=current_user.organization_id, role='admin').count()
        if admin_count <= 1:
            return jsonify({
                'success': False,
                'message': 'Cannot demote the sole administrator of the organization.'
            }), 400

    prev_role = target_user.role
    target_user.role = new_role
    db.session.commit()

    AuditService.log_event(
        action='USER_ROLE_UPDATED',
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details={
            'targetUserId': target_user.id,
            'targetUserEmail': target_user.email,
            'previousRole': prev_role,
            'newRole': new_role
        },
        ip_address=request.remote_addr or '127.0.0.1'
    )

    return jsonify({
        'success': True,
        'message': f"Updated {target_user.full_name}'s role to {new_role}.",
        'user': target_user.to_dict()
    }), 200

@users_bp.route('/<user_id>', methods=['DELETE'])
@auth_required
@admin_required
def delete_user(user_id):
    current_user = get_current_user()
    if user_id == current_user.id:
        return jsonify({'success': False, 'message': 'Cannot delete your own administrator account.'}), 400

    target_user = db.session.get(User, user_id)
    if not target_user:
        return jsonify({'success': False, 'message': 'User not found.'}), 404

    if target_user.organization_id != current_user.organization_id:
        return jsonify({'success': False, 'message': 'Cannot delete cross-tenant user.'}), 403

    db.session.delete(target_user)
    db.session.commit()

    AuditService.log_event(
        action='USER_DELETED',
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details={'deletedUserId': user_id, 'deletedUserEmail': target_user.email},
        ip_address=request.remote_addr or '127.0.0.1'
    )

    return jsonify({
        'success': True,
        'message': f"User {target_user.email} removed from organization."
    }), 200
