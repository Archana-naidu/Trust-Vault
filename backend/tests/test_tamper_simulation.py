import io
import pytest

def test_adversarial_tamper_simulation_and_recovery(client, admin_token, owner_token):
    # 1. Owner uploads pristine document
    content = b"Critical System Firmware Calibration Baseline"
    upload_res = client.post(
        '/api/documents/upload',
        data={
            'file': (io.BytesIO(content), 'firmware.pdf', 'application/pdf'),
            'title': 'Firmware Baseline'
        },
        content_type='multipart/form-data',
        headers={'Authorization': f'Bearer {owner_token}'}
    )
    doc_id = upload_res.json['document']['id']
    orig_hash = upload_res.json['sha256Hash']

    # 2. Non-admin user attempts tamper simulation -> 403 Forbidden
    unauth_tamper = client.post(
        f'/api/documents/{doc_id}/simulate-tamper',
        headers={'Authorization': f'Bearer {owner_token}'}
    )
    assert unauth_tamper.status_code == 403

    # 3. Admin simulates tampering on stored document file
    admin_tamper = client.post(
        f'/api/documents/{doc_id}/simulate-tamper',
        headers={'Authorization': f'Bearer {admin_token}'}
    )
    assert admin_tamper.status_code == 200
    assert admin_tamper.json['success'] is True

    # 4. Trigger cryptographic verification -> MUST detect tampering!
    tamper_verify = client.post(
        f'/api/documents/{doc_id}/verify',
        headers={'Authorization': f'Bearer {owner_token}'}
    )
    assert tamper_verify.status_code == 200
    t_data = tamper_verify.json
    assert t_data['status'] == 'TAMPER_DETECTED'
    assert t_data['match'] is False
    assert t_data['currentHash'] != orig_hash
    assert 'CRITICAL' in t_data['explanation'] or 'TAMPER' in t_data['explanation']

    # 5. Non-admin attempts restoration -> 403 Forbidden
    unauth_restore = client.post(
        f'/api/documents/{doc_id}/restore-tamper',
        headers={'Authorization': f'Bearer {owner_token}'}
    )
    assert unauth_restore.status_code == 403

    # 6. Admin restores pristine file from backup
    admin_restore = client.post(
        f'/api/documents/{doc_id}/restore-tamper',
        headers={'Authorization': f'Bearer {admin_token}'}
    )
    assert admin_restore.status_code == 200
    assert admin_restore.json['success'] is True

    # 7. Re-run verification -> MUST be restored to VERIFIED AUTHENTIC!
    restored_verify = client.post(
        f'/api/documents/{doc_id}/verify',
        headers={'Authorization': f'Bearer {owner_token}'}
    )
    assert restored_verify.status_code == 200
    r_data = restored_verify.json
    assert r_data['status'] == 'VERIFIED'
    assert r_data['match'] is True
    assert r_data['currentHash'] == orig_hash
