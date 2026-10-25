import io
import pytest

def test_document_sharing_and_revocation_workflow(client, owner_token, viewer_token, cross_token):
    # 1. Owner uploads document
    file_bytes = b"Shared Project Architecture Blueprint"
    upload_res = client.post(
        '/api/documents/upload',
        data={
            'file': (io.BytesIO(file_bytes), 'architecture.txt', 'text/plain'),
            'title': 'Architecture Blueprint'
        },
        content_type='multipart/form-data',
        headers={'Authorization': f'Bearer {owner_token}'}
    )
    doc_id = upload_res.json['document']['id']

    # 2. Before sharing, Viewer cannot download -> 403 Forbidden
    unshared_dl = client.get(f'/api/documents/{doc_id}/download', headers={'Authorization': f'Bearer {viewer_token}'})
    assert unshared_dl.status_code == 403

    # 3. Owner shares document with Viewer (bob@cyberdyne.com)
    share_res = client.post(
        f'/api/documents/{doc_id}/share',
        json={'email': 'bob@cyberdyne.com', 'permission': 'viewer'},
        headers={'Authorization': f'Bearer {owner_token}'}
    )
    assert share_res.status_code == 200
    share_id = share_res.json['share']['id']
    assert share_res.json['share']['permission'] == 'viewer'

    # 4. Viewer can now download the document -> 200 OK
    viewer_dl = client.get(f'/api/documents/{doc_id}/download', headers={'Authorization': f'Bearer {viewer_token}'})
    assert viewer_dl.status_code == 200
    assert viewer_dl.data == file_bytes

    # 5. Viewer can verify the document
    viewer_verify = client.post(f'/api/documents/{doc_id}/verify', headers={'Authorization': f'Bearer {viewer_token}'})
    assert viewer_verify.status_code == 200
    assert viewer_verify.json['status'] == 'VERIFIED'

    # 6. Viewer sees the document under filter='shared'
    shared_list = client.get('/api/documents?filter=shared', headers={'Authorization': f'Bearer {viewer_token}'})
    assert shared_list.status_code == 200
    assert any(d['id'] == doc_id for d in shared_list.json['documents'])

    # 7. Viewer attempts deletion -> 403 Forbidden
    viewer_delete = client.delete(f'/api/documents/{doc_id}', headers={'Authorization': f'Bearer {viewer_token}'})
    assert viewer_delete.status_code == 403

    # 8. Owner revokes access
    revoke_res = client.delete(f'/api/shares/{share_id}', headers={'Authorization': f'Bearer {owner_token}'})
    assert revoke_res.status_code == 200

    # 9. Subsequent download by Viewer -> 403 Forbidden
    revoked_dl = client.get(f'/api/documents/{doc_id}/download', headers={'Authorization': f'Bearer {viewer_token}'})
    assert revoked_dl.status_code == 403
