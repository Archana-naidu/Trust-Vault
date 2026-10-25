import json
from datetime import datetime
from flask import current_app
from app.extensions import db
from app.models.models import AuditLog, AuditTamperBackup, generate_uuid
from app.services.hash_service import HashService

class AuditService:
    @staticmethod
    def _format_timestamp(dt: datetime) -> str:
        """
        Formats datetime into a consistent ISO-8601 UTC string.
        """
        if isinstance(dt, str):
            return dt
        return dt.strftime('%Y-%m-%dT%H:%M:%S.%fZ')

    @classmethod
    def log_event(
        cls,
        action: str,
        organization_id: str | None = None,
        user_id: str | None = None,
        user_email: str | None = None,
        document_id: str | None = None,
        document_name: str | None = None,
        details: dict | str | None = None,
        ip_address: str = '127.0.0.1'
    ) -> AuditLog:
        """
        Appends a new immutable, hash-chained event to the audit trail.
        """
        latest_log = AuditLog.query.order_by(AuditLog.sequence_num.desc()).first()

        sequence_num = (latest_log.sequence_num + 1) if latest_log else 1
        genesis_hash = current_app.config.get('GENESIS_HASH', '0' * 64)
        previous_event_hash = latest_log.current_event_hash if latest_log else genesis_hash
        event_id = f"EVT-{sequence_num:06d}"
        
        now = datetime.utcnow()
        timestamp_str = cls._format_timestamp(now)

        details_str = json.dumps(details, sort_keys=True) if isinstance(details, dict) else (details or '')

        current_event_hash = HashService.calculate_audit_hash(
            previous_event_hash=previous_event_hash,
            sequence_num=sequence_num,
            timestamp=timestamp_str,
            user_id=user_id or 'SYSTEM',
            action=action,
            document_id=document_id or 'NONE',
            details=details_str
        )

        audit_entry = AuditLog(
            id=generate_uuid(),
            event_id=event_id,
            sequence_num=sequence_num,
            organization_id=organization_id,
            user_id=user_id,
            user_email=user_email,
            action=action,
            document_id=document_id,
            document_name=document_name,
            details=details_str,
            ip_address=ip_address,
            timestamp=now,
            previous_event_hash=previous_event_hash,
            current_event_hash=current_event_hash
        )

        db.session.add(audit_entry)
        db.session.commit()
        return audit_entry

    @classmethod
    def verify_audit_chain(cls, organization_id: str | None = None) -> dict:
        """
        Cryptographically verifies the audit chain from Genesis to Head.
        Detects:
        1. Modified record content (recalculated hash != stored current hash)
        2. Broken chain linkages (previous hash != parent current hash)
        3. Sequence gaps or reordered entries
        4. Genesis block corruption
        """
        query = AuditLog.query.order_by(AuditLog.sequence_num.asc())
        if organization_id:
            query = query.filter_by(organization_id=organization_id)
        
        logs = query.all()

        if not logs:
            return {
                'status': 'VALID',
                'isValid': True,
                'totalRecords': 0,
                'message': 'Audit trail is empty. Genesis state intact.',
                'verificationTimestamp': datetime.utcnow().isoformat(),
                'details': []
            }

        genesis_hash = current_app.config.get('GENESIS_HASH', '0' * 64)
        expected_prev_hash = genesis_hash
        expected_seq = 1
        compromised_entries = []

        for record in logs:
            reasons = []

            # 1. Sequence continuity
            if record.sequence_num != expected_seq:
                reasons.append(f"Sequence mismatch: expected #{expected_seq}, found #{record.sequence_num}")

            # 2. Parent linkage
            if record.previous_event_hash != expected_prev_hash:
                reasons.append(
                    f"Broken chain linkage: recorded previous_event_hash ({record.previous_event_hash[:12]}...) "
                    f"does not match parent current_event_hash ({expected_prev_hash[:12]}...)"
                )

            # 3. Recalculate hash deterministically
            ts_str = cls._format_timestamp(record.timestamp)
            recomputed_hash = HashService.calculate_audit_hash(
                previous_event_hash=record.previous_event_hash,
                sequence_num=record.sequence_num,
                timestamp=ts_str,
                user_id=record.user_id or 'SYSTEM',
                action=record.action,
                document_id=record.document_id or 'NONE',
                details=record.details or ''
            )

            if recomputed_hash != record.current_event_hash:
                reasons.append(
                    f"Cryptographic signature invalidated: recalculation ({recomputed_hash[:12]}...) "
                    f"differs from stored current_hash ({record.current_event_hash[:12]}...). Record content was modified."
                )

            if reasons:
                compromised_entries.append({
                    'eventId': record.event_id,
                    'sequenceNum': record.sequence_num,
                    'action': record.action,
                    'timestamp': record.timestamp.isoformat() if record.timestamp else None,
                    'storedHash': record.current_event_hash,
                    'recomputedHash': recomputed_hash,
                    'previousEventHash': record.previous_event_hash,
                    'expectedPreviousHash': expected_prev_hash,
                    'reasons': reasons
                })

            expected_prev_hash = record.current_event_hash
            expected_seq = record.sequence_num + 1

        is_valid = len(compromised_entries) == 0

        return {
            'status': 'VALID' if is_valid else 'TAMPER_DETECTED',
            'isValid': is_valid,
            'totalRecords': len(logs),
            'headHash': logs[-1].current_event_hash if logs else None,
            'genesisHash': genesis_hash,
            'firstEventTime': logs[0].timestamp.isoformat() if logs and logs[0].timestamp else None,
            'lastEventTime': logs[-1].timestamp.isoformat() if logs and logs[-1].timestamp else None,
            'compromisedCount': len(compromised_entries),
            'compromisedEntries': compromised_entries,
            'verificationTimestamp': datetime.utcnow().isoformat(),
            'message': (
                f"Audit chain verified successfully across all {len(logs)} sequential blocks. "
                "Cryptographic hash continuity is unbroken."
                if is_valid else
                f"CRITICAL ALERT: Tampering detected in audit chain! {len(compromised_entries)} compromised or broken block(s) detected."
            ),
            'disclaimer': (
                "Notice: Cryptographic hash chaining provides tamper evidence and non-repudiation by detecting unauthorized "
                "modifications or deletions. However, if an attacker obtains complete administrative write control over the "
                "underlying database engine, they could theoretically rewrite the entire chain from scratch. For maximum enterprise "
                "defense-in-depth, cryptographic hashes should additionally be anchored to an external WORM (Write Once Read Many) "
                "ledger or distributed timestamping authority."
            )
        }

    @classmethod
    def simulate_audit_tamper(cls, sequence_num: int | None = None) -> dict:
        """
        Simulates unauthorized audit log tampering by modifying record content in DB.
        """
        if sequence_num:
            target = AuditLog.query.filter_by(sequence_num=sequence_num).first()
        else:
            count = AuditLog.query.count()
            if count == 0:
                raise ValueError("Audit trail is empty. Generate some events first.")
            target_seq = max(1, count // 2)
            target = AuditLog.query.filter_by(sequence_num=target_seq).first()

        if not target:
            raise ValueError("Target audit log record not found.")

        # Save pristine backup
        backup = AuditTamperBackup(
            id=generate_uuid(),
            audit_log_id=target.id,
            original_action=target.action,
            original_details=target.details,
            original_hash=target.current_event_hash
        )
        db.session.add(backup)

        tampered_action = 'UNAUTHORIZED_ADMIN_BYPASS' if target.action != 'UNAUTHORIZED_ADMIN_BYPASS' else 'MALICIOUS_LOG_ALTERATION'
        tampered_details = json.dumps({
            'tampered': True,
            'originalAction': target.action,
            'maliciousPayload': 'ADVERSARIAL_AUDIT_RECORD_MUTATION_TEST'
        })

        target.action = tampered_action
        target.details = tampered_details
        db.session.commit()

        return {
            'success': True,
            'eventId': target.event_id,
            'sequenceNum': target.sequence_num,
            'tamperedAction': tampered_action,
            'message': f"Audit entry #{target.sequence_num} ({target.event_id}) maliciously altered. Chain integrity is now broken."
        }

    @classmethod
    def repair_audit_tamper(cls) -> dict:
        """
        Restores tampered audit records from pristine backup.
        """
        backups = AuditTamperBackup.query.all()
        if not backups:
            return {'success': True, 'restoredCount': 0, 'message': 'No tampered audit entries found to restore.'}

        for b in backups:
            log_record = db.session.get(AuditLog, b.audit_log_id)
            if log_record:
                log_record.action = b.original_action
                log_record.details = b.original_details
                log_record.current_event_hash = b.original_hash
            db.session.delete(b)

        db.session.commit()
        return {
            'success': True,
            'restoredCount': len(backups),
            'message': f"Successfully restored {len(backups)} tampered audit record(s) to original cryptographic state."
        }
