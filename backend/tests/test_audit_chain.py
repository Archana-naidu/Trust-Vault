import pytest

def test_hash_chained_audit_verification_and_tamper_detection(client, admin_token, owner_token):
    # 1. Verify chain is initially valid
    verify_res = client.post('/api/audit/verify', headers={'Authorization': f'Bearer {owner_token}'})
    assert verify_res.status_code == 200
    report = verify_res.json['report']
    assert report['status'] == 'VALID'
    assert report['isValid'] is True
    assert report['compromisedCount'] == 0
    assert report['totalRecords'] >= 1

    # 2. Non-admin cannot simulate audit tamper -> 403 Forbidden
    unauth_tamper = client.post('/api/audit/simulate-tamper', json={}, headers={'Authorization': f'Bearer {owner_token}'})
    assert unauth_tamper.status_code == 403

    # 3. Admin simulates audit tamper
    admin_tamper = client.post('/api/audit/simulate-tamper', json={}, headers={'Authorization': f'Bearer {admin_token}'})
    assert admin_tamper.status_code == 200
    assert admin_tamper.json['success'] is True

    # 4. Chain verification MUST identify the compromised record!
    compromised_res = client.post('/api/audit/verify', headers={'Authorization': f'Bearer {owner_token}'})
    assert compromised_res.status_code == 200
    c_report = compromised_res.json['report']
    assert c_report['status'] == 'TAMPER_DETECTED'
    assert c_report['isValid'] is False
    assert c_report['compromisedCount'] >= 1
    assert len(c_report['compromisedEntries']) >= 1

    # Check reason mentions cryptographic deviation
    reasons = c_report['compromisedEntries'][0]['reasons']
    assert any('Cryptographic signature invalidated' in r or 'Broken chain linkage' in r for r in reasons)

    # 5. Admin repairs audit tamper
    repair_res = client.post('/api/audit/repair', headers={'Authorization': f'Bearer {admin_token}'})
    assert repair_res.status_code == 200
    assert repair_res.json['success'] is True

    # 6. Chain verification returns to VALID
    repaired_res = client.post('/api/audit/verify', headers={'Authorization': f'Bearer {owner_token}'})
    assert repaired_res.status_code == 200
    r_report = repaired_res.json['report']
    assert r_report['status'] == 'VALID'
    assert r_report['isValid'] is True
    assert r_report['compromisedCount'] == 0
