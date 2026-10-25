import os
import sys
import io
import pytest

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from config import TestingConfig
from app.extensions import db
from app.models.models import (
    Organization,
    User,
    Document,
    DocumentVersion,
    DocumentShare,
    VerificationRecord,
    AuditLog,
    generate_uuid
)
from app.services.storage_service import storage_service
from app.services.audit_service import AuditService

@pytest.fixture(scope='session')
def app():
    # Use isolated test storage folders
    test_vault = os.path.join(TestingConfig.BASE_DIR, 'uploads', 'test_vault')
    test_backup = os.path.join(TestingConfig.BASE_DIR, 'uploads', 'test_backup')
    os.makedirs(test_vault, exist_ok=True)
    os.makedirs(test_backup, exist_ok=True)

    app = create_app(TestingConfig)
    yield app

    # Cleanup test uploads
    import shutil
    shutil.rmtree(test_vault, ignore_errors=True)
    shutil.rmtree(test_backup, ignore_errors=True)

@pytest.fixture(scope='function')
def client(app):
    with app.app_context():
        db.create_all()
        storage_service.init_directories()

        # Seed test tenants
        org1 = Organization(id="org-1-id", name="CyberDyne Security", slug="cyberdyne")
        org2 = Organization(id="org-2-id", name="Umbrella Corp", slug="umbrella")
        db.session.add_all([org1, org2])
        db.session.commit()

        # Seed test users in Org 1
        admin = User(id="admin-id", organization_id=org1.id, email="admin@cyberdyne.com", full_name="Admin User", role="admin")
        admin.set_password("Admin@12345")

        owner = User(id="owner-id", organization_id=org1.id, email="alice@cyberdyne.com", full_name="Alice Owner", role="owner")
        owner.set_password("Alice@12345")

        viewer = User(id="viewer-id", organization_id=org1.id, email="bob@cyberdyne.com", full_name="Bob Viewer", role="viewer")
        viewer.set_password("Bob@12345")

        # Seed cross-tenant user in Org 2
        cross_user = User(id="cross-id", organization_id=org2.id, email="charlie@umbrella.com", full_name="Charlie Cross", role="owner")
        cross_user.set_password("Charlie@12345")

        db.session.add_all([admin, owner, viewer, cross_user])
        db.session.commit()

        # Seed baseline audit event
        AuditService.log_event(
            action="GENESIS_INITIALIZED",
            organization_id=org1.id,
            user_id=admin.id,
            user_email=admin.email,
            details={"message": "Test suite genesis initialized"}
        )

        test_client = app.test_client()
        yield test_client

        db.session.remove()
        db.drop_all()

def login_and_get_token(client, email, password):
    res = client.post('/api/auth/login', json={'email': email, 'password': password})
    return res.json.get('token')

@pytest.fixture
def admin_token(client):
    return login_and_get_token(client, "admin@cyberdyne.com", "Admin@12345")

@pytest.fixture
def owner_token(client):
    return login_and_get_token(client, "alice@cyberdyne.com", "Alice@12345")

@pytest.fixture
def viewer_token(client):
    return login_and_get_token(client, "bob@cyberdyne.com", "Bob@12345")

@pytest.fixture
def cross_token(client):
    return login_and_get_token(client, "charlie@umbrella.com", "Charlie@12345")
