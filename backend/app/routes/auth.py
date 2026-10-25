from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from app.extensions import db
from app.models.models import User, Organization, generate_uuid
from app.services.audit_service import AuditService
from app.utils.decorators import auth_required, get_current_user
from app.utils.validators import validate_email

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    full_name = (data.get('full_name') or '').strip()
    role = (data.get('role') or 'viewer').strip().lower()
    org_id_or_name = (data.get('organization_id') or data.get('organization_name') or '').strip()

    if not email or not password or not full_name:
        return jsonify({
            'success': False,
            'message': 'All fields (email, password, full_name) are required.'
        }), 400

    if not validate_email(email):
        return jsonify({
            'success': False,
            'message': 'Please provide a valid email address.'
        }), 400

    if len(password) < 6:
        return jsonify({
            'success': False,
            'message': 'Password must be at least 6 characters long.'
        }), 400

    if role not in {'admin', 'owner', 'editor', 'viewer'}:
        role = 'owner'

    # Check duplicate
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({
            'success': False,
            'message': 'An account with this email address already exists.'
        }), 409

    # Resolve Organization
    org = None
    if org_id_or_name:
        org = Organization.query.filter(
            (Organization.id == org_id_or_name) | 
            (Organization.name == org_id_or_name) | 
            (Organization.slug == org_id_or_name.lower().replace(' ', '-'))
        ).first()

    if not org:
        # Default or create new tenant organization
        default_org_name = org_id_or_name if org_id_or_name else 'TrustVault Cyber Defense Corp'
        slug = default_org_name.lower().replace(' ', '-').replace('_', '-')
        org = Organization.query.filter_by(slug=slug).first()
        if not org:
            org = Organization(
                id=generate_uuid(),
                name=default_org_name,
                slug=slug
            )
            db.session.add(org)
            db.session.commit()

    # Create new user
    new_user = User(
        id=generate_uuid(),
        organization_id=org.id,
        email=email,
        full_name=full_name,
        role=role
    )
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    # Log registration in hash-chained audit ledger
    AuditService.log_event(
        action='USER_REGISTERED',
        organization_id=org.id,
        user_id=new_user.id,
        user_email=new_user.email,
        details={'role': new_user.role, 'fullName': new_user.full_name, 'organization': org.name},
        ip_address=request.remote_addr or '127.0.0.1'
    )

    token = create_access_token(identity=new_user.id)

    return jsonify({
        'success': True,
        'message': 'Account successfully registered.',
        'user': new_user.to_dict(),
        'token': token
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({
            'success': False,
            'message': 'Email and password are required.'
        }), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({
            'success': False,
            'message': 'Invalid email or password credentials.'
        }), 401

    token = create_access_token(identity=user.id)

    # Log login in audit ledger
    AuditService.log_event(
        action='USER_LOGGED_IN',
        organization_id=user.organization_id,
        user_id=user.id,
        user_email=user.email,
        details={'role': user.role, 'organizationId': user.organization_id},
        ip_address=request.remote_addr or '127.0.0.1'
    )

    return jsonify({
        'success': True,
        'message': 'Authentication successful.',
        'user': user.to_dict(),
        'token': token
    }), 200

@auth_bp.route('/me', methods=['GET'])
@auth_required
def get_me():
    user = get_current_user()
    return jsonify({
        'success': True,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/users', methods=['GET'])
@auth_required
def get_tenant_users():
    """
    Returns registered users within the caller's organization (excluding self)
    for document sharing and permission delegation.
    """
    current_user = get_current_user()
    users = User.query.filter(
        User.organization_id == current_user.organization_id,
        User.id != current_user.id
    ).order_by(User.full_name.asc()).all()

    return jsonify({
        'success': True,
        'users': [u.to_dict() for u in users]
    }), 200
