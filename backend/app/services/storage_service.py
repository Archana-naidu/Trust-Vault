import os
import shutil
import re
from flask import current_app

class StorageService:
    def __init__(self, vault_dir=None, backup_dir=None):
        self._vault_dir = vault_dir
        self._backup_dir = backup_dir

    @property
    def vault_dir(self):
        if self._vault_dir:
            return self._vault_dir
        return current_app.config['UPLOAD_FOLDER']

    @property
    def backup_dir(self):
        if self._backup_dir:
            return self._backup_dir
        return current_app.config['BACKUP_FOLDER']

    def init_directories(self):
        os.makedirs(self.vault_dir, exist_ok=True)
        os.makedirs(self.backup_dir, exist_ok=True)

    def sanitize_filename(self, filename: str) -> str:
        base = os.path.basename(filename)
        return re.sub(r'[^a-zA-Z0-9._-]', '_', base)

    def get_vault_file_path(self, stored_filename: str) -> str:
        safe_name = self.sanitize_filename(stored_filename)
        resolved_path = os.path.abspath(os.path.join(self.vault_dir, safe_name))
        vault_root = os.path.abspath(self.vault_dir)
        
        # Anti-directory traversal guard
        if not resolved_path.startswith(vault_root):
            raise PermissionError("Access denied: Illegal file path traversal attempt.")
        return resolved_path

    def get_backup_file_path(self, stored_filename: str) -> str:
        safe_name = self.sanitize_filename(stored_filename)
        return os.path.abspath(os.path.join(self.backup_dir, safe_name))

    def create_backup_copy(self, stored_filename: str):
        vault_path = self.get_vault_file_path(stored_filename)
        backup_path = self.get_backup_file_path(stored_filename)
        if os.path.exists(vault_path):
            shutil.copyfile(vault_path, backup_path)

    def simulate_file_tamper(self, stored_filename: str) -> dict:
        """
        Simulates file tampering by corrupting bytes directly on disk.
        For authorized evaluation testing.
        """
        vault_path = self.get_vault_file_path(stored_filename)
        if not os.path.exists(vault_path):
            raise FileNotFoundError("Stored file does not exist on disk.")

        backup_path = self.get_backup_file_path(stored_filename)
        if not os.path.exists(backup_path):
            shutil.copyfile(vault_path, backup_path)

        # Inject byte corruption payload into stored file
        tamper_signature = b"\n<!-- TAMPER_INJECTION: UNAUTHORIZED_DATA_MUTATION_TEST_PAYLOAD -->\n"
        with open(vault_path, 'ab') as f:
            f.write(tamper_signature)

        return {
            'success': True,
            'vaultPath': vault_path,
            'message': 'Tampering simulated: file byte-stream corrupted on disk. Cryptographic SHA-256 hash has changed.'
        }

    def restore_original_file(self, stored_filename: str) -> dict:
        """
        Restores pristine snapshot after tamper simulation.
        """
        vault_path = self.get_vault_file_path(stored_filename)
        backup_path = self.get_backup_file_path(stored_filename)

        if not os.path.exists(backup_path):
            raise FileNotFoundError("No pristine backup snapshot found to restore from.")

        shutil.copyfile(backup_path, vault_path)
        return {
            'success': True,
            'message': 'Original file restored from pristine snapshot. Cryptographic hash is back to baseline.'
        }

    def delete_file(self, stored_filename: str):
        try:
            vault_path = self.get_vault_file_path(stored_filename)
            if os.path.exists(vault_path):
                os.remove(vault_path)
            backup_path = self.get_backup_file_path(stored_filename)
            if os.path.exists(backup_path):
                os.remove(backup_path)
        except Exception:
            pass

storage_service = StorageService()
