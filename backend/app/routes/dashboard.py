from flask import Blueprint, jsonify
from sqlalchemy import func
from app.extensions import db
from app.models.models import Document, DocumentShare, VerificationRecord, AuditLog
from app.utils.decorators import auth_required, get_current_user

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/stats', methods=['GET'])
@auth_required
def get_stats():
    current_user = get_current_user()
    org_id = current_user.organization_id
    user_id = current_user.id

    # 1. Total Documents accessible to this user within organization
    if current_user.role == 'admin':
        total_docs_query = Document.query.filter_by(organization_id=org_id, is_deleted=0)
    else:
        total_docs_query = Document.query.filter(
            Document.organization_id == org_id,
            Document.is_deleted == 0,
            (Document.owner_id == user_id) | (Document.shares.any(DocumentShare.shared_with == user_id))
        )
    total_docs = total_docs_query.count()

    # 2. Documents Owned & Shared out by this user
    docs_shared = db.session.query(func.count(func.distinct(DocumentShare.document_id))).join(
        Document, DocumentShare.document_id == Document.id
    ).filter(
        Document.organization_id == org_id,
        Document.owner_id == user_id,
        Document.is_deleted == 0
    ).scalar() or 0

    # 3. Documents Received (shared with user by others)
    docs_received = db.session.query(func.count(func.distinct(DocumentShare.document_id))).join(
        Document, DocumentShare.document_id == Document.id
    ).filter(
        Document.organization_id == org_id,
        DocumentShare.shared_with == user_id,
        Document.is_deleted == 0
    ).scalar() or 0

    # 4. Verification Breakdown for accessible documents
    accessible_docs = total_docs_query.all()
    verified_count = 0
    tamper_alerts = 0
    unverified_count = 0

    for doc in accessible_docs:
        latest_v = doc.verifications[0] if doc.verifications else None
        if not latest_v or latest_v.status == 'UNVERIFIED':
            unverified_count += 1
        elif latest_v.status == 'VERIFIED':
            verified_count += 1
        elif latest_v.status == 'TAMPER_DETECTED':
            tamper_alerts += 1
        else:
            unverified_count += 1

    # 5. Total Audit Events in tenant
    total_audit_events = AuditLog.query.filter_by(organization_id=org_id).count()

    # 6. Recent accessible documents
    recent_docs = [
        d.to_dict(current_user_id=user_id)
        for d in total_docs_query.order_by(Document.created_at.desc()).limit(6).all()
    ]

    # 7. Recent Security Activities from audit log
    recent_activities = [
        a.to_dict()
        for a in AuditLog.query.filter_by(organization_id=org_id).order_by(AuditLog.sequence_num.desc()).limit(8).all()
    ]

    # 8. Event distribution by action
    action_counts = db.session.query(
        AuditLog.action,
        func.count(AuditLog.id).label('count')
    ).filter_by(organization_id=org_id).group_by(AuditLog.action).order_by(func.count(AuditLog.id).desc()).limit(7).all()

    activity_distribution = [
        {'action': item.action, 'count': item.count}
        for item in action_counts
    ]

    # 9. Verification status chart data
    status_chart_data = [
        {'name': 'Verified Authentic', 'value': verified_count, 'color': '#10b981'},
        {'name': 'Tampering Alert', 'value': tamper_alerts, 'color': '#ef4444'},
        {'name': 'Pending Verification', 'value': unverified_count, 'color': '#6366f1'}
    ]

    return jsonify({
        'success': True,
        'stats': {
            'totalDocuments': total_docs,
            'documentsShared': docs_shared,
            'documentsReceived': docs_received,
            'verifiedDocuments': verified_count,
            'tamperingAlerts': tamper_alerts,
            'totalAuditEvents': total_audit_events
        },
        'charts': {
            'verificationStatus': status_chart_data,
            'activityDistribution': activity_distribution
        },
        'recentDocuments': recent_docs,
        'recentActivities': recent_activities
    }), 200
