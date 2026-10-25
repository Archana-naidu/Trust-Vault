import hashlib
import os
import json

class HashService:
    @staticmethod
    def calculate_file_hash(file_path: str) -> str:
        """
        Computes SHA-256 hash of a file on disk.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found at path: {file_path}")

        sha256 = hashlib.sha256()
        with open(file_path, 'rb') as f:
            while chunk := f.read(65536):
                sha256.update(chunk)
        return sha256.hexdigest().lower()

    @staticmethod
    def calculate_buffer_hash(data: bytes | str) -> str:
        """
        Computes SHA-256 hash of an in-memory buffer or string.
        """
        if isinstance(data, str):
            data = data.encode('utf-8')
        return hashlib.sha256(data).hexdigest().lower()

    @staticmethod
    def calculate_audit_hash(
        previous_event_hash: str,
        sequence_num: int,
        timestamp: str,
        user_id: str | None = None,
        action: str = '',
        document_id: str | None = None,
        details: str | dict | None = None
    ) -> str:
        """
        Computes canonical SHA-256 hash linking previousEventHash.
        Format: SHA256(previousHash | sequenceNum | timestamp | userId | action | documentId | canonicalDetails)
        """
        normalized_details = ''
        if isinstance(details, dict):
            # Deterministic JSON representation with sorted keys
            normalized_details = json.dumps(details, sort_keys=True, separators=(',', ':'))
        elif details is not None:
            normalized_details = str(details)

        canonical_string = "|".join([
            str(previous_event_hash or ''),
            str(sequence_num),
            str(timestamp or ''),
            str(user_id or 'SYSTEM'),
            str(action or ''),
            str(document_id or 'NONE'),
            normalized_details
        ])

        return hashlib.sha256(canonical_string.encode('utf-8')).hexdigest().lower()

    @staticmethod
    def verify_file_integrity(file_path: str, expected_hash: str) -> dict:
        """
        Recalculates file hash and verifies bit-for-bit equivalence.
        """
        recalculated_hash = HashService.calculate_file_hash(file_path)
        match = (recalculated_hash.lower() == expected_hash.lower())

        return {
            'match': match,
            'originalHash': expected_hash.lower(),
            'recalculatedHash': recalculated_hash.lower(),
            'message': (
                'Cryptographic integrity verified. Current file byte-stream matches the original upload SHA-256 signature.'
                if match else
                'CRITICAL TAMPER DETECTED: Stored file byte-stream deviates from original cryptographic signature.'
            )
        }
