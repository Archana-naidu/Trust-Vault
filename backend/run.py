import os
from app import create_app
from config import Config

app = create_app(Config)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() in ('true', '1')
    
    print("====================================================")
    print("  TRUSTVAULT SECURE DOCUMENT PLATFORM (FLASK)")
    print(f"  Backend Active: http://localhost:{port}")
    print("  Architecture:   Multi-Tenant Flask REST API")
    print("  Database:       SQLite with SQLAlchemy ORM")
    print("  Cryptography:   SHA-256 Bitstream Verification")
    print("  Audit Engine:   Hash-Chained Append-Only Ledger")
    print("====================================================")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
