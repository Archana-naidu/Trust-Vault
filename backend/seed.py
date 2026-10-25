import os
import shutil
from app import create_app
from app.extensions import db
from app.models.models import (
    Organization,
    User,
    Document,
    DocumentVersion,
    DocumentShare,
    VerificationRecord,
    AuditLog,
    AuditTamperBackup,
    generate_uuid
)
from app.services.hash_service import HashService
from app.services.storage_service import storage_service
from app.services.audit_service import AuditService

def generate_minimal_pdf() -> bytes:
    """
    Generates a valid, minimal PDF 1.4 byte stream for realistic PDF testing.
    """
    pdf_content = (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Contents 4 0 R /Resources << >> >>\nendobj\n"
        b"4 0 obj\n<< /Length 55 >>\nstream\n"
        b"BT\n/F1 12 Tf\n72 712 Td\n(TrustVault Secure PDF Integrity Benchmark) Tj\nET\n"
        b"endstream\nendobj\n"
        b"xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n"
        b"0000000115 00000 n \n0000000223 00000 n \n"
        b"trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n329\n%%EOF\n"
    )
    return pdf_content

def seed_database():
    app = create_app()
    with app.app_context():
        print("[Seed] Initializing TrustVault database schema...")
        storage_service.init_directories()

        # Reset tables
        db.drop_all()
        db.create_all()
        print("[Seed] Schema created cleanly.")

        # 1. Create Multi-Tenant Organizations
        org_trustvault = Organization(
            id=generate_uuid(),
            name="TrustVault Cyber Defense Corp",
            slug="trustvault-corp"
        )
        org_acme = Organization(
            id=generate_uuid(),
            name="Acme Global Secure Ltd",
            slug="acme-global"
        )
        db.session.add(org_trustvault)
        db.session.add(org_acme)
        db.session.commit()
        print(f"[Seed] Created Organizations: '{org_trustvault.name}' & '{org_acme.name}'")

        # 2. Create Users across roles
        # Org 1: TrustVault
        admin_user = User(
            id=generate_uuid(),
            organization_id=org_trustvault.id,
            email="admin@trustvault.io",
            full_name="System Administrator",
            role="admin"
        )
        admin_user.set_password("TrustVault@2025")

        alice_user = User(
            id=generate_uuid(),
            organization_id=org_trustvault.id,
            email="alice@trustvault.io",
            full_name="Alice Johnson (Security Lead)",
            role="owner"
        )
        alice_user.set_password("Alice@2025")

        bob_user = User(
            id=generate_uuid(),
            organization_id=org_trustvault.id,
            email="bob@trustvault.io",
            full_name="Bob Smith (Compliance Auditor)",
            role="viewer"
        )
        bob_user.set_password("Bob@2025")

        editor_user = User(
            id=generate_uuid(),
            organization_id=org_trustvault.id,
            email="editor@trustvault.io",
            full_name="David Vance (Technical Editor)",
            role="editor"
        )
        editor_user.set_password("Editor@2025")

        # Org 2: Acme Global
        charlie_user = User(
            id=generate_uuid(),
            organization_id=org_acme.id,
            email="charlie@acme.com",
            full_name="Charlie Davis (Acme Director)",
            role="owner"
        )
        charlie_user.set_password("Charlie@2025")

        db.session.add_all([admin_user, alice_user, bob_user, editor_user, charlie_user])
        db.session.commit()
        print("[Seed] Created default user accounts across roles and tenants.")

        # Seed audit logs for user registration
        for u in [admin_user, alice_user, bob_user, editor_user, charlie_user]:
            AuditService.log_event(
                action="USER_REGISTERED",
                organization_id=u.organization_id,
                user_id=u.id,
                user_email=u.email,
                details={"role": u.role, "fullName": u.full_name, "organization": u.organization.name}
            )

        # 3. Seed Sample Documents
        sample_docs = [
            {
                "title": "Enterprise Cryptographic & Data Protection Policy 2025",
                "description": "Zero-trust cryptographic protocol standards, SHA-256 integrity benchmarks, and hash-chain audit enforcement standards.",
                "filename": "Corporate_Security_Policy_2025.txt",
                "mime": "text/plain",
                "ext": ".txt",
                "content": (
                    "================================================================================\n"
                    "TRUSTVAULT ENTERPRISE SECURITY SPECIFICATION - REV 2025.4\n"
                    "CLASSIFICATION: TOP-SECRET / INTERNAL ONLY\n"
                    "================================================================================\n\n"
                    "1. ZERO-TRUST ARCHITECTURE\n"
                    "All data resting within TrustVault is verified through cryptographic SHA-256 hashing.\n"
                    "No stored entity is presumed authentic without an on-demand cryptographic bitstream recalculation.\n\n"
                    "2. TAMPER-EVIDENT AUDIT TRAIL\n"
                    "Every transactional modification (Upload, Share, Permission Change, Download, Verification)\n"
                    "is committed into an append-only hash-chained ledger.\n"
                    "Each record references the SHA-256 digest of its preceding block:\n"
                    "  H(n) = SHA256( H(n-1) || Seq || Time || User || Action || Document || Details )\n\n"
                    "3. ACCESS CONTROL MATRIX\n"
                    "- Viewer: Read-only access, on-demand verification, secure download streaming.\n"
                    "- Editor: Modification authorization, version bump submission, metadata tuning.\n"
                    "- Owner: Complete autonomy including revocation and cryptographic deletion.\n"
                    "- Admin: System governance, tenant configuration, and adversarial tamper testing.\n\n"
                    "4. RECORD IMMUTABILITY POLICY\n"
                    "Administrative operators are strictly restricted from direct SQL updates without tripping\n"
                    "hash chain invalidation.\n\n"
                    "Approved by: Security Governance Board\n"
                    "Verification ID: TV-SEC-2025-9988\n"
                    "================================================================================\n"
                ).encode("utf-8"),
                "owner": alice_user,
                "org": org_trustvault
            },
            {
                "title": "Q4 Financial Compliance & Integrity Audit",
                "description": "Quarterly financial ledger cryptographic reconciliation, sovereign asset audit trail, and regulatory disclosures.",
                "filename": "Financial_Audit_Report_Q4.txt",
                "mime": "text/plain",
                "ext": ".txt",
                "content": (
                    "================================================================================\n"
                    "TRUSTVAULT INDEPENDENT COMPLIANCE AUDIT - Q4 2025\n"
                    "STATUS: CERTIFIED AUTHENTIC\n"
                    "================================================================================\n\n"
                    "EXECUTIVE SUMMARY:\n"
                    "Independent assessment confirmed 100% adherence to cryptographic data retention\n"
                    "and tamper-evident storage compliance standards.\n\n"
                    "KEY FINDINGS:\n"
                    "1. Vault Storage Encryption: Local encrypted containers verified.\n"
                    "2. Cryptographic Checksums: Zero deviation across 4,200 archived transactions.\n"
                    "3. Hash-Chained Audit Logs: Continuous cryptographic unbroken linkage verified.\n"
                    "4. Tamper Detection Sensitivity: 100% detection rate during adversarial bit-flip tests.\n\n"
                    "Lead Auditor: Bob Smith, CISA\n"
                    "Review Date: October 2025\n"
                    "================================================================================\n"
                ).encode("utf-8"),
                "owner": alice_user,
                "org": org_trustvault
            },
            {
                "title": "TrustVault Multi-Tenant Security Whitepaper",
                "description": "Comprehensive specification covering organization boundary enforcement, SHA-256 verification and RBAC.",
                "filename": "TrustVault_Security_Whitepaper.pdf",
                "mime": "application/pdf",
                "ext": ".pdf",
                "content": generate_minimal_pdf(),
                "owner": admin_user,
                "org": org_trustvault
            },
            {
                "title": "Acme Global Sovereign Asset Ledger",
                "description": "Internal asset inventory and zero-trust verification records for Acme Global.",
                "filename": "Acme_Asset_Ledger.txt",
                "mime": "text/plain",
                "ext": ".txt",
                "content": (
                    "ACME GLOBAL SOVEREIGN ASSET INVENTORY\n"
                    "TENANT ID: acme-global\n"
                    "SECURE ISOLATION TEST RECORD\n"
                    "CONFIDENTIAL ACME INTERNAL ONLY\n"
                ).encode("utf-8"),
                "owner": charlie_user,
                "org": org_acme
            }
        ]

        seeded_docs = []
        for doc_info in sample_docs:
            doc_id = generate_uuid()
            version_id = generate_uuid()
            stored_filename = f"vault_seed_{doc_id[:16]}_{doc_info['filename']}"
            vault_path = storage_service.get_vault_file_path(stored_filename)

            with open(vault_path, "wb") as f:
                f.write(doc_info["content"])

            file_size = len(doc_info["content"])
            file_hash = HashService.calculate_file_hash(vault_path)

            storage_service.create_backup_copy(stored_filename)

            d = Document(
                id=doc_id,
                organization_id=doc_info["org"].id,
                owner_id=doc_info["owner"].id,
                title=doc_info["title"],
                description=doc_info["description"],
                original_filename=doc_info["filename"],
                stored_filename=stored_filename,
                file_path=vault_path,
                file_size=file_size,
                mime_type=doc_info["mime"],
                file_extension=doc_info["ext"],
                current_version=1,
                is_deleted=0
            )

            dv = DocumentVersion(
                id=version_id,
                document_id=doc_id,
                version_number=1,
                stored_filename=stored_filename,
                file_path=vault_path,
                file_size=file_size,
                sha256_hash=file_hash,
                uploaded_by=doc_info["owner"].id,
                change_summary="Initial seed baseline"
            )

            vr = VerificationRecord(
                id=generate_uuid(),
                document_id=doc_id,
                version_number=1,
                verified_by=doc_info["owner"].id,
                original_hash=file_hash,
                recalculated_hash=file_hash,
                status="VERIFIED",
                verification_message="Initial upload verification: SHA-256 hash cataloged successfully."
            )

            db.session.add(d)
            db.session.add(dv)
            db.session.add(vr)
            db.session.commit()

            AuditService.log_event(
                action="DOCUMENT_UPLOADED",
                organization_id=doc_info["org"].id,
                user_id=doc_info["owner"].id,
                user_email=doc_info["owner"].email,
                document_id=doc_id,
                document_name=doc_info["title"],
                details={
                    "originalFilename": doc_info["filename"],
                    "fileSize": file_size,
                    "mimeType": doc_info["mime"],
                    "sha256Hash": file_hash,
                    "version": 1
                }
            )
            seeded_docs.append(d)

        print(f"[Seed] Successfully cataloged {len(seeded_docs)} secure documents with SHA-256 baseline hashes.")

        # 4. Create Document Shares
        # Share Corporate Security Policy with Bob as Viewer
        policy_doc = seeded_docs[0]
        share1 = DocumentShare(
            id=generate_uuid(),
            document_id=policy_doc.id,
            shared_by=alice_user.id,
            shared_with=bob_user.id,
            permission="viewer"
        )
        db.session.add(share1)

        # Share Financial Audit with David (Editor)
        audit_doc = seeded_docs[1]
        share2 = DocumentShare(
            id=generate_uuid(),
            document_id=audit_doc.id,
            shared_by=alice_user.id,
            shared_with=editor_user.id,
            permission="editor"
        )
        db.session.add(share2)
        db.session.commit()

        AuditService.log_event(
            action="DOCUMENT_SHARED",
            organization_id=org_trustvault.id,
            user_id=alice_user.id,
            user_email=alice_user.email,
            document_id=policy_doc.id,
            document_name=policy_doc.title,
            details={
                "recipientId": bob_user.id,
                "recipientEmail": bob_user.email,
                "recipientName": bob_user.full_name,
                "permission": "viewer"
            }
        )

        AuditService.log_event(
            action="DOCUMENT_SHARED",
            organization_id=org_trustvault.id,
            user_id=alice_user.id,
            user_email=alice_user.email,
            document_id=audit_doc.id,
            document_name=audit_doc.title,
            details={
                "recipientId": editor_user.id,
                "recipientEmail": editor_user.email,
                "recipientName": editor_user.full_name,
                "permission": "editor"
            }
        )

        print("[Seed] Document shares created and committed.")

        # 5. Verify the Hash Chain Integrity
        report = AuditService.verify_audit_chain()
        print("====================================================")
        print("  TRUSTVAULT SEED & AUDIT VERIFICATION REPORT")
        print(f"  Chain Status: {report['status']}")
        print(f"  Total Blocks: {report['totalRecords']}")
        print(f"  Head Hash:    {report['headHash']}")
        print(f"  Genesis Hash: {report['genesisHash']}")
        print(f"  Is Valid:     {report['isValid']}")
        print("====================================================")

if __name__ == "__main__":
    seed_database()
