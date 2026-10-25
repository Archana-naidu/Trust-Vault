import pytest

def test_user_registration_success(client):
    res = client.post('/api/auth/register', json={
        'email': 'newuser@cyberdyne.com',
        'password': 'SecurePassword@123',
        'full_name': 'New Tester',
        'role': 'owner',
        'organization_name': 'CyberDyne Security'
    })
    assert res.status_code == 201
    data = res.json
    assert data['success'] is True
    assert 'token' in data
    assert data['user']['email'] == 'newuser@cyberdyne.com'
    assert data['user']['role'] == 'owner'

def test_user_registration_duplicate_email(client):
    res = client.post('/api/auth/register', json={
        'email': 'alice@cyberdyne.com',
        'password': 'Password123!',
        'full_name': 'Alice Johnson'
    })
    assert res.status_code == 409
    assert 'already exists' in res.json['message']

def test_user_registration_invalid_email(client):
    res = client.post('/api/auth/register', json={
        'email': 'not-an-email',
        'password': 'Password123!',
        'full_name': 'Invalid Email'
    })
    assert res.status_code == 400

def test_user_registration_short_password(client):
    res = client.post('/api/auth/register', json={
        'email': 'shortpass@cyberdyne.com',
        'password': '123',
        'full_name': 'Short Pass'
    })
    assert res.status_code == 400

def test_user_login_success(client):
    res = client.post('/api/auth/login', json={
        'email': 'alice@cyberdyne.com',
        'password': 'Alice@12345'
    })
    assert res.status_code == 200
    data = res.json
    assert data['success'] is True
    assert 'token' in data
    assert data['user']['email'] == 'alice@cyberdyne.com'

def test_user_login_invalid_password(client):
    res = client.post('/api/auth/login', json={
        'email': 'alice@cyberdyne.com',
        'password': 'WrongPassword!'
    })
    assert res.status_code == 401
    assert 'Invalid' in res.json['message']

def test_user_me_endpoint(client, owner_token):
    res = client.get('/api/auth/me', headers={'Authorization': f'Bearer {owner_token}'})
    assert res.status_code == 200
    assert res.json['user']['email'] == 'alice@cyberdyne.com'
    assert res.json['user']['role'] == 'owner'

def test_tenant_users_scoping(client, owner_token):
    res = client.get('/api/auth/users', headers={'Authorization': f'Bearer {owner_token}'})
    assert res.status_code == 200
    users = res.json['users']
    emails = [u['email'] for u in users]
    # Org 1 users should be listed (excluding Alice herself)
    assert 'admin@cyberdyne.com' in emails
    assert 'bob@cyberdyne.com' in emails
    assert 'alice@cyberdyne.com' not in emails
    # Charlie is in Org 2 (Umbrella Corp) and MUST NOT appear
    assert 'charlie@umbrella.com' not in emails
