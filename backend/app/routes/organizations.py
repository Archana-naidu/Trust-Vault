from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.models import Organization, generate_uuid
from app.services.audit_service import AuditService
from app.utils.decorators import auth_required, admin_required, get_current_user

org_bp = Blueprint('organizations', __name__, url_prefix='/api/organizations')

@org_bp.route('', methods=['GET'])
def list_organizations():
    """
    Public or authenticated listing of available organizations.
    """
    orgs = Organization.query.order_by(Organization.name.asc()).all()
    return jsonify({
        'success': True,
        'organizations': [o.to_dict() for o in orgs]
    }), 200

@org_bp.route('', methods=['POST'])
@auth_required
@admin_required
def create_organization():
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()

    if not name:
        return jsonify({
            'success': False,
            'message': 'Organization name is required.'
        }), 400

    slug = name.lower().replace(' ', '-').replace('_', '-')
    existing = Organization.query.filter_by(slug=slug).first()
    if existing:
        return jsonify({
            'success': False,
            'message': f"Organization with slug '{slug}' already exists."
        }), 409

    org = Organization(
        id=generate_uuid(),
        name=name,
        slug=slug
    )
    db.session.add(org)
    db.session.commit()

    current_user = get_current_user()
    AuditService.log_event(
        action='ORGANIZATION_CREATED',
        organization_id=org.id,
        user_id=current_user.id,
        user_email=current_user.email,
        details={'organizationName': org.name, 'slug': org.slug},
        ip_address=request.remote_addr or '127.0.0.1'
    )

    return jsonify({
        'success': True,
        'message': f"Organization '{org.name}' created successfully.",
        'organization': org.to_dict()
    }), 201

@org_bp.route('/<org_id>', methods=['GET'])
@auth_required
def get_organization(org_id):
    current_user = get_current_user()
    if current_user.role != 'admin' and current_user.organization_id != org_id:
        return jsonify({
            'success': False,
            'message': 'Cross-tenant access prohibited.'
        }), 403

    org = db.session.get(Organization, org_id)
    if not org:
        return jsonify({'success': False, 'message': 'Organization not found.'}), 404

    return jsonify({
        'success': True,
        'organization': org.to_dict(),
        'users_count': len(org.users),
        'documents_count': len([d for d in org.documents if d.is_deleted == 0])
    }), 200
