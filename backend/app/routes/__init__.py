from app.routes.auth import auth_bp
from app.routes.documents import documents_bp
from app.routes.shares import shares_bp
from app.routes.audit import audit_bp
from app.routes.dashboard import dashboard_bp
from app.routes.organizations import org_bp
from app.routes.users import users_bp

__all__ = [
    'auth_bp',
    'documents_bp',
    'shares_bp',
    'audit_bp',
    'dashboard_bp',
    'org_bp',
    'users_bp'
]
