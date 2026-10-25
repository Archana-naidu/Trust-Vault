import io
import hashlib
import pytest

def test_sha256_verification_workflow(client, owner_token):
    content = b"%PDF-1.4\nAuthentic Legal Contract Content\n%%EOF"
    expected_hash = hashlib.sha256(content).hexdigest().lower()

    # Step 1: Upload document and store baseline hash
    upload_res = client.post(
        '/api/documents/upload',
        data={
            'file': (io.BytesIO(content), 'legal_contract.pdf', 'application/pdf'),
            'title': 'Master Services Agreement'
        },
        content_type='multipart/form-data',
        headers={'Authorization': f'Bearer {owner_token}'}
    )
    doc_id = upload_res.json['document']['id']
    assert upload_res.json['sha256Hash'] == expected_hash

    # Step 2: Trigger on-demand verification
    verify_res = client.post(
        f'/api/documents/{doc_id}/verify',
        headers={'Authorization': f'Bearer {owner_token}'}
    )
    assert verify_res.status_code == 200
    v_data = verify_res.json
    assert v_data['success'] is True
    assert v_data['status'] == 'VERIFIED'
    assert v_data['match'] is True
    assert v_data['originalHash'] == expected_hash
    assert v_data['currentHash'] == expected_hash
    assert 'authentic and unmodified' in v_data['explanation']

    # Step 3: Confirm document details reflect the verification
    get_res = client.get(f'/api/documents/{doc_id}', headers={'Authorization': f'Bearer {owner_token}'})
    doc = get_res.json['document']
    assert doc['latest_verification_status'] == 'VERIFIED'
    assert doc['latest_verified_hash'] == expected_hash

    # Step 4: Confirm verification record history
    ver_history = get_res.json['verificationHistory']
    assert len(ver_history) >= 2  # initial upload + on-demand verify
    assert ver_history[0]['status'] == 'VERIFIED'
