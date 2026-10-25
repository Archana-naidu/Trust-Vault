import os
from flask import Flask, jsonify
from config import Config
from app.extensions import db, jwt, cors
from app.routes import (
    auth_bp,
    documents_bp,
    shares_bp,
    audit_bp,
    dashboard_bp,
    org_bp,
    users_bp
)

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize Extensions
    db.init_app(app)
    jwt.init_app(app)
    
    # Configure CORS for full frontend compatibility
    cors.init_app(app, resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Ensure Upload Directories Exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['BACKUP_FOLDER'], exist_ok=True)
    os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'database'), exist_ok=True)

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(documents_bp)
    app.register_blueprint(shares_bp)
    app.register_blueprint(audit_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(org_bp)
    app.register_blueprint(users_bp)

    # Health Check API
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'online',
            'service': 'TrustVault Python Flask Document Security Service',
            'database': 'SQLite with SQLAlchemy ORM',
            'cryptography': 'SHA-256 Bitstream Verification & Hash-Chained Audit Ledger',
            'multiTenancy': 'Active (Isolated Organizations)',
            'timestamp': os.environ.get('CURRENT_TIME', '')
        }), 200

    # JWT Error Handlers
    @jwt.unauthorized_loader
    def custom_unauthorized_response(err_str):
        return jsonify({
            'success': False,
            'message': 'Authentication required. Missing or malformed Bearer token.'
        }), 401

    @jwt.expired_token_loader
    def custom_expired_token_response(jwt_header, jwt_payload):
        return jsonify({
            'success': False,
            'message': 'Session expired. Please log in again.'
        }), 401

    @jwt.invalid_token_loader
    def custom_invalid_token_response(err_str):
        return jsonify({
            'success': False,
            'message': f'Invalid authentication token: {err_str}'
        }), 401

    # Global Error Handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({
            'success': False,
            'message': 'Requested resource was not found on this server.'
        }), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({
            'success': False,
            'message': 'An internal server error occurred.'
        }), 500

    return app
