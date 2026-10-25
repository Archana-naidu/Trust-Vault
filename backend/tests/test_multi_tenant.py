import io
import pytest

def test_multi_tenant_isolation_enforcement(client, owner_token, cross_token):
    # 1. Alice (CyberDyne, Org 1) uploads sensitive document
    upload_res = client.post(
        '/api/documents/upload',
        data={
            'file': (io.BytesIO(b"CyberDyne Top Secret Intellectual Property"), 'ip.txt', 'text/plain'),
            'title': 'CyberDyne IP Document'
        },
        content_type='multipart/form-data',
        headers={'Authorization': f'Bearer {owner_token}'}
    )
    doc_id = upload_res.json['document']['id']

    # 2. Charlie (Umbrella Corp, Org 2) attempts to fetch document details -> 403 Forbidden
    cross_get = client.get(f'/api/documents/{doc_id}', headers={'Authorization': f'Bearer {cross_token}'})
    assert cross_get.status_code == 403
    assert 'Cross-tenant' in cross_get.json['message']

    # 3. Charlie attempts to download document -> 403 Forbidden
    cross_dl = client.get(f'/api/documents/{doc_id}/download', headers={'Authorization': f'Bearer {cross_token}'})
    assert cross_dl.status_code == 403
    assert 'Cross-tenant' in cross_dl.json['message']

    # 4. Charlie attempts to verify document -> 403 Forbidden
    cross_verify = client.post(f'/api/documents/{doc_id}/verify', headers={'Authorization': f'Bearer {cross_token}'})
    assert cross_verify.status_code == 403
    assert 'Cross-tenant' in cross_verify.json['message']

    # 5. Charlie attempts to delete document -> 403 Forbidden
    cross_del = client.delete(f'/api/documents/{doc_id}', headers={'Authorization': f'Bearer {cross_token}'})
    assert cross_del.status_code == 403
    assert 'Cross-tenant' in cross_del.json['message']

    # 6. Alice attempts to share with Charlie (different tenant) -> 403 Forbidden
    cross_share = client.post(
        f'/api/documents/{doc_id}/share',
        json={'email': 'charlie@umbrella.com', 'permission': 'viewer'},
        headers={'Authorization': f'Bearer {owner_token}'}
    )
    assert cross_share.status_code == 403
    assert 'Cross-tenant sharing prohibited' in cross_share.json['message']

    # 7. Charlie's document list does not contain CyberDyne's document
    charlie_list = client.get('/api/documents', headers={'Authorization': f'Bearer {cross_token}'})
    assert charlie_list.status_code == 200
    charlie_doc_ids = [d['id'] for d in charlie_list.json['documents']]
    assert doc_id not in charlie_doc_ids
