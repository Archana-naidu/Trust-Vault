from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.extensions import db
from app.models.models import User

def get_current_user():
    """
    Returns the currently authenticated user for the active request.
    """
    try:
        identity = get_jwt_identity()
        if not identity:
            return None
        return db.session.get(User, identity)
    except Exception:
        return None

def auth_required(f):
    """
    Decorator requiring a valid JWT bearer token and existing user account.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f"Authentication required: {str(e)}"
            }), 401

        user = get_current_user()
        if not user:
            return jsonify({
                'success': False,
                'message': 'Invalid session: User account not found.'
            }), 401

        return f(*args, **kwargs)
    return decorated_function

def role_required(*allowed_roles):
    """
    Decorator ensuring current user possesses one of the authorized roles.
    Roles: 'admin', 'owner', 'editor', 'viewer'
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                verify_jwt_in_request()
            except Exception as e:
                return jsonify({
                    'success': False,
                    'message': f"Authentication required: {str(e)}"
                }), 401

            user = get_current_user()
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'Invalid session.'
                }), 401

            user_role = (user.role or '').lower()
            allowed = [r.lower() for r in allowed_roles]

            if user_role not in allowed and user_role != 'admin':
                return jsonify({
                    'success': False,
                    'message': f"Forbidden: Insufficient privileges. Required role: {', '.join(allowed_roles)}. Your role: {user.role}"
                }), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator

def admin_required(f):
    """
    Shortcut decorator for administrative endpoints.
    """
    return role_required('admin')(f)
