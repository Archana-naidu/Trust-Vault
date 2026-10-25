import io
import pytest

def test_dashboard_metrics_aggregation(client, admin_token, owner_token, viewer_token):
    # Initial stats
    init_res = client.get('/api/dashboard/stats', headers={'Authorization': f'Bearer {owner_token}'})
    assert init_res.status_code == 200
    stats = init_res.json['stats']
    initial_doc_count = stats['totalDocuments']

    # 1. Upload new document
    upload_res = client.post(
        '/api/documents/upload',
        data={
            'file': (io.BytesIO(b"Dashboard verification metric sample"), 'sample.txt', 'text/plain'),
            'title': 'Dashboard Sample'
        },
        content_type='multipart/form-data',
        headers={'Authorization': f'Bearer {owner_token}'}
    )
    doc_id = upload_res.json['document']['id']

    # 2. Share with Viewer
    client.post(
        f'/api/documents/{doc_id}/share',
        json={'email': 'bob@cyberdyne.com', 'permission': 'viewer'},
        headers={'Authorization': f'Bearer {owner_token}'}
    )

    # 3. Fetch Owner Dashboard
    owner_stats_res = client.get('/api/dashboard/stats', headers={'Authorization': f'Bearer {owner_token}'})
    assert owner_stats_res.status_code == 200
    o_stats = owner_stats_res.json['stats']
    assert o_stats['totalDocuments'] == initial_doc_count + 1
    assert o_stats['documentsShared'] >= 1
    assert o_stats['verifiedDocuments'] >= 1

    # 4. Fetch Viewer Dashboard
    viewer_stats_res = client.get('/api/dashboard/stats', headers={'Authorization': f'Bearer {viewer_token}'})
    assert viewer_stats_res.status_code == 200
    v_stats = viewer_stats_res.json['stats']
    assert v_stats['documentsReceived'] >= 1

    # 5. Charts and activity log data present
    charts = owner_stats_res.json['charts']
    assert 'verificationStatus' in charts
    assert 'activityDistribution' in charts
    assert len(owner_stats_res.json['recentDocuments']) >= 1
    assert len(owner_stats_res.json['recentActivities']) >= 1
