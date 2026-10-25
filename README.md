# TRUSTVAULT
### Enterprise Secure Document Sharing & Tamper-Evident Audit Platform

[![Backend: Python Flask](https://img.shields.io/badge/Backend-Python%203.13%20%7C%20Flask%203.1-blue.svg)](https://flask.palletsprojects.com/)
[![Security: SHA-256](https://img.shields.io/badge/Security-SHA--256%20Cryptographic%20Verification-blue.svg)](https://en.wikipedia.org/wiki/SHA-2)
[![Audit: Hash-Chained Ledger](https://img.shields.io/badge/Audit-Hash--Chained%20Ledger-purple.svg)](https://en.wikipedia.org/wiki/Hash_chain)
[![Database: SQLite SQLAlchemy](https://img.shields.io/badge/Database-SQLite%20%7C%20SQLAlchemy%202.0-emerald.svg)](https://www.sqlalchemy.org/)
[![UI: React + Vite + Tailwind](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%20%7C%20TailwindCSS-indigo.svg)](https://vitejs.dev/)
[![Tests: Pytest Passed](https://img.shields.io/badge/Tests-Pytest%20(19%2F19%20Passed)-success.svg)](https://pytest.org/)

**TrustVault** is an enterprise-grade document management and secure sharing platform engineered to guarantee document authenticity and provide transparency through an append-only, tamper-evident activity ledger.

Built for the **Snovasys Hiring Challenge**, TrustVault provides a production-grade full-stack architecture powered by **Python, Flask, SQLite with SQLAlchemy ORM, and React 19**, incorporating real cryptographic algorithms, multi-tenant isolation, granular role-based access controls, and interactive adversarial testing sandboxes.

---

## 1. Key Capabilities & Architecture

1. **Multi-Tenant Architecture**:
   - Supports multiple isolated organizations (realms).
   - Enforces strict tenant-level access on every API endpoint.
   - Prevents cross-tenant document browsing, downloads, verifications, deletions, and sharing attempts with immediate `403 Forbidden` responses.

2. **SHA-256 Cryptographic Bitstream Verification**:
   - Computes an immutable 256-bit SHA-256 hash directly from raw file bytes during upload.
   - Stores baseline hash in `document_versions` linked to Version 1.
   - On-demand verification recalculates the hash of the physical disk file and compares it bit-for-bit with the cataloged baseline.
   - Detects any disk-level unauthorized byte alterations or bit-rot with a `TAMPER DETECTED` alert.

3. **Hash-Chained Append-Only Audit Ledger**:
   - Every transactional state change (`USER_REGISTERED`, `USER_LOGGED_IN`, `DOCUMENT_UPLOADED`, `DOCUMENT_DOWNLOADED`, `DOCUMENT_VERIFIED`, `DOCUMENT_SHARED`, `ACCESS_REVOKED`, `DOCUMENT_DELETED`, `TAMPER_SIMULATED`, `FILE_RESTORED`) is recorded into an append-only ledger.
   - Each audit record cryptographically links to the preceding block's hash:
     $$H_n = \text{SHA-256}(H_{n-1} \parallel \text{Seq} \parallel \text{Timestamp} \parallel \text{UserID} \parallel \text{Action} \parallel \text{DocID} \parallel \text{Details})$$
   - The chain verification engine validates sequential continuity, parent linkages, Genesis consistency (`0000...`), and recomputed block digests.

4. **Granular Role-Based Access Control (RBAC)**:
   - **Admin**: System governance, organization user management, audit repair, and adversarial tamper testing.
   - **Owner**: Full autonomy over owned documents: upload, view, download, share, and delete.
   - **Editor**: Delegated access to inspect permitted documents, verify hashes, and stream downloads.
   - **Viewer**: Read-only access: view document metadata, download permitted files, and trigger verification.

5. **Defense-in-Depth Storage Security**:
   - Files are stored outside public web roots (`uploads/vault/`).
   - Uses collision-proof UUID naming to eliminate directory traversal attacks (`../`).
   - Extension and MIME-type validation for PDF, DOCX, TXT, PNG, and JPG files.

6. **Adversarial Tamper Simulation Lab**:
   - Dedicated interactive sandbox for hiring challenge evaluators.
   - **Lab 1**: Corrupt physical file bytes on disk and witness SHA-256 mismatch detection; restore pristine backup.
   - **Lab 2**: Maliciously alter audit records in the database and watch the chain pinpoint the exact compromised block; repair ledger to valid cryptographic state.

---

## 2. Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS, React Router v7, Axios, Lucide React, Recharts.
- **Backend**: Python 3.13, Flask 3.1, Flask-JWT-Extended, Flask-CORS, Werkzeug security.
- **Database & ORM**: SQLite (WAL mode active), SQLAlchemy 2.0 ORM with relational models, constraints, and indexes.
- **Cryptography & Security**: Native Python `hashlib` (SHA-256), Werkzeug password hashing (scrypt / pbkdf2), JWT Bearer tokens with 24-hour expiration.
- **Testing**: Pytest 9.1 with 19 comprehensive end-to-end tests.

---

## 3. Quick Start & Startup Commands

### Prerequisites
- Python 3.11+ or 3.13+
- Node.js (v18+) and npm (v9+)

### Installation
From the project root:
```bash
# 1. Install Python backend dependencies
python -m pip install -r backend/requirements.txt

# 2. Install frontend dependencies
npm --prefix frontend install
```

### Database Initialization & Seeding
Pre-populates sample organizations, users, cryptographically hashed documents, shares, and an unbroken audit chain:
```bash
python backend/seed.py
```

### Running the Application

**Option A: Single Command Concurrent Runner**
```bash
npm run dev
```

**Option B: Separate Terminals**
```bash
# Terminal 1: Start Flask Backend (Runs on http://localhost:5000)
python backend/run.py

# Terminal 2: Start React Frontend (Runs on http://localhost:5173)
npm --prefix frontend run dev
```

Open your browser to: **`http://localhost:5173`**

---

## 4. Pre-Seeded Demo Accounts

Four demo accounts are ready. You can log in manually or click the **One-Click Demo Account Login** buttons on the Login page:

| Role | Email | Password | Organization | Key Capabilities |
|---|---|---|---|---|
| **Administrator** | `admin@trustvault.io` | `TrustVault@2025` | TrustVault Cyber Defense Corp | User management, audit repair, tamper simulation |
| **Security Lead (Owner)** | `alice@trustvault.io` | `Alice@2025` | TrustVault Cyber Defense Corp | Document owner, upload, share, download, verify |
| **Compliance Auditor (Viewer)** | `bob@trustvault.io` | `Bob@2025` | TrustVault Cyber Defense Corp | Read-only viewer, download, verify integrity |
| **Acme Director (Cross-Tenant)** | `charlie@acme.com` | `Charlie@2025` | Acme Global Secure Ltd | Tests multi-tenant isolation (blocked from TrustVault) |

---

## 5. Required Pages Implemented (10/10)

1. **Login Page (`/login`)**: Secure JWT authentication, password reveal toggle, one-click demo login buttons for all roles and tenants.
2. **Registration Page (`/register`)**: Identity enrollment with Full Name, Email, Password, Tenant Organization selection/creation, and Role assignment.
3. **Dashboard Page (`/dashboard`)**: Real-time aggregated metrics from SQLite (Total Documents, Shared, Received, Verified, Tampering Alerts, Total Audit Events), verification status breakdown chart, and recent audit activity feed.
4. **My Documents (`/documents`)**: Filterable document repository (Owned vs Shared, search by title, extension filter, verification status filter), quick actions (Verify, Download, Share, Delete).
5. **Upload Document (`/upload`)**: Dedicated ingestion page supporting drag-and-drop file upload, title, description, progress tracking, and instant SHA-256 fingerprinting.
6. **Shared Documents (`/shared`)**: Displays documents shared with the logged-in user with permission badges (Viewer / Editor) and sharer metadata.
7. **Document Verification / Detail (`/documents/:id`)**: Comprehensive document inspection view with metadata, Version 1 baseline SHA-256 hash, live bitstream verification trigger, active share manager, and audit trail.
8. **Audit Trail Page (`/audit`)**: Append-only hash-chained ledger viewer with action filtering, user filtering, sequential pagination, and real-time cryptographic audit chain verification.
9. **User Management (`/users`)**: Administrator governance dashboard for the organization; view enrolled identities, update roles (Owner, Editor, Viewer, Admin), and manage access.
10. **Tamper Simulation Lab (`/tamper-lab`)**: Authorized administrator sandbox for adversarial testing; corrupt physical file bytes on disk, observe real-time SHA-256 deviation, restore from backup, and test audit ledger row tampering.

---

## 6. Automated Pytest Verification

A complete automated test suite of **19 tests** validates every challenge scenario:

```bash
python -m pytest backend/tests -v
```

### Test Scenarios Validated:
- `test_auth.py`: User registration, validation, duplicate prevention, Werkzeug password hashing, login token issuance, profile fetch, tenant user isolation.
- `test_documents.py`: PDF document upload, SHA-256 calculation, Viewer upload restriction, document listing, authenticated download, authorized deletion.
- `test_integrity.py`: SHA-256 on-demand recalculation, hash match verification, verification history recording, audit log commitment.
- `test_sharing_rbac.py`: Document sharing with Viewer, unauthorized download rejection (`403`), permitted download, Viewer deletion prevention, access revocation.
- `test_multi_tenant.py`: Cross-tenant document access rejection (`403`), cross-tenant download rejection (`403`), cross-tenant verify rejection (`403`), cross-tenant sharing rejection (`403`), tenant listing isolation.
- `test_tamper_simulation.py`: Non-admin tamper rejection (`403`), admin byte corruption simulation, `TAMPER_DETECTED` assertion, backup restoration, return to `VERIFIED AUTHENTIC`.
- `test_audit_chain.py`: Unbroken Genesis-to-Head verification, admin audit row tampering, detection of compromised sequence and broken linkage, ledger restoration to `VALID`.
- `test_dashboard.py`: Aggregation of real database statistics, shared/received counts, chart data distribution.

---

## 7. REST API Reference

### Authentication & Tenant Scoping
- `POST /api/auth/register` - Register user with organization & role
- `POST /api/auth/login` - Authenticate & obtain JWT bearer token
- `GET /api/auth/me` - Get profile of authenticated identity
- `GET /api/auth/users` - List users in the caller's organization (for sharing)

### Document Management
- `POST /api/documents/upload` - Upload & cryptographically index document (Multipart)
- `GET /api/documents` - List accessible documents with search and filters
- `GET /api/documents/<id>` - Get document metadata, versions, and audit history
- `GET /api/documents/<id>/download` - Stream download authorized document
- `DELETE /api/documents/<id>` - Soft delete document (Owner / Admin only)
- `POST /api/documents/<id>/verify` - Recalculate SHA-256 and verify authenticity
- `POST /api/documents/<id>/simulate-tamper` - Corrupt file on disk (Admin only)
- `POST /api/documents/<id>/restore-tamper` - Restore pristine file (Admin only)

### Sharing & Access Delegation
- `POST /api/documents/<id>/share` - Share document with user in same organization
- `GET /api/shares` - List active shares for user's documents
- `DELETE /api/shares/<id>` - Revoke access delegation

### Cryptographic Audit Ledger
- `GET /api/audit` - Paginated audit logs with action & user filters
- `POST /api/audit/verify` - Cryptographically verify hash chain integrity
- `POST /api/audit/simulate-tamper` - Simulate audit record modification (Admin only)
- `POST /api/audit/repair` - Restore tampered audit record from backup (Admin only)

### User & Organization Governance
- `GET /api/users` - List all users in organization (Admin only)
- `PATCH /api/users/<id>/role` - Update user role (Admin only)
- `DELETE /api/users/<id>` - Remove user from organization (Admin only)
- `GET /api/organizations` - List active organizations
- `POST /api/organizations` - Create new organization (Admin only)

### Dashboard Metrics
- `GET /api/dashboard/stats` - Real database counts, breakdown charts, and recent activity
