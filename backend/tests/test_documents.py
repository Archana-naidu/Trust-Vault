import io
import hashlib
import pytest

def test_upload_pdf_document_success(client, owner_token):
    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<< /Title (Test Confidential Doc) >>\nendobj\ntrailer\n<< >>\n%%EOF\n"
    expected_hash = hashlib.sha256(pdf_bytes).hexdigest().lower()

    data = {
        'file': (io.BytesIO(pdf_bytes), 'confidential_report.pdf', 'application/pdf'),
        'title': 'Confidential PDF Report',
        'description': 'Important enterprise audit documentation'
    }

    res = client.post(
        '/api/documents/upload',
        data=data,
        content_type='multipart/form-data',
        headers={'Authorization': f'Bearer {owner_token}'}
    )

    assert res.status_code == 201
    res_data = res.json
    assert res_data['success'] is True
    assert res_data['sha256Hash'] == expected_hash
    assert res_data['document']['title'] == 'Confidential PDF Report'
    assert res_data['document']['original_hash'] == expected_hash
    assert res_data['document']['file_extension'] == '.pdf'

def test_viewer_upload_rejected(client, viewer_token):
    pdf_bytes = b"%PDF-1.4\nTest\n%%EOF"
    data = {
        'file': (io.BytesIO(pdf_bytes), 'test.pdf', 'application/pdf'),
        'title': 'Viewer Document'
    }
    res = client.post(
        '/api/documents/upload',
        data=data,
        content_type='multipart/form-data',
        headers={'Authorization': f'Bearer {viewer_token}'}
    )
    assert res.status_code == 403
    assert 'Viewers are not permitted' in res.json['message']

def test_list_and_get_document(client, owner_token):
    # Upload first
    data = {
        'file': (io.BytesIO(b"Document Content Here"), 'notes.txt', 'text/plain'),
        'title': 'Meeting Notes'
    }
    upload_res = client.post(
        '/api/documents/upload',
        data=data,
        content_type='multipart/form-data',
        headers={'Authorization': f'Bearer {owner_token}'}
    )
    doc_id = upload_res.json['document']['id']

    # List documents
    list_res = client.get('/api/documents', headers={'Authorization': f'Bearer {owner_token}'})
    assert list_res.status_code == 200
    docs = list_res.json['documents']
    assert any(d['id'] == doc_id for d in docs)

    # Get single document
    get_res = client.get(f'/api/documents/{doc_id}', headers={'Authorization': f'Bearer {owner_token}'})
    assert get_res.status_code == 200
    assert get_res.json['document']['title'] == 'Meeting Notes'

def test_download_document_owner(client, owner_token):
    file_content = b"Binary stream for testing download"
    data = {
        'file': (io.BytesIO(file_content), 'download_test.txt', 'text/plain'),
        'title': 'Download Test'
    }
    upload_res = client.post(
        '/api/documents/upload',
        data=data,
        content_type='multipart/form-data',
        headers={'Authorization': f'Bearer {owner_token}'}
    )
    doc_id = upload_res.json['document']['id']

    dl_res = client.get(f'/api/documents/{doc_id}/download', headers={'Authorization': f'Bearer {owner_token}'})
    assert dl_res.status_code == 200
    assert dl_res.data == file_content

def test_delete_document_owner_and_unauthorized(client, owner_token, viewer_token):
    data = {
        'file': (io.BytesIO(b"File to be deleted"), 'delete_me.txt', 'text/plain'),
        'title': 'Delete Me'
    }
    upload_res = client.post(
        '/api/documents/upload',
        data=data,
        content_type='multipart/form-data',
        headers={'Authorization': f'Bearer {owner_token}'}
    )
    doc_id = upload_res.json['document']['id']

    # Viewer attempts delete -> 403 Forbidden
    unauth_del = client.delete(f'/api/documents/{doc_id}', headers={'Authorization': f'Bearer {viewer_token}'})
    assert unauth_del.status_code == 403

    # Owner deletes -> 200 OK
    owner_del = client.delete(f'/api/documents/{doc_id}', headers={'Authorization': f'Bearer {owner_token}'})
    assert owner_del.status_code == 200

    # Subsequent fetch returns 404
    fetch_del = client.get(f'/api/documents/{doc_id}', headers={'Authorization': f'Bearer {owner_token}'})
    assert fetch_del.status_code == 404
