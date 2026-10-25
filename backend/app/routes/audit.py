from flask import Blueprint, request, jsonify
from app.models.models import AuditLog
from app.services.audit_service import AuditService
from app.utils.decorators import auth_required, admin_required, get_current_user

audit_bp = Blueprint('audit', __name__, url_prefix='/api/audit')

@audit_bp.route('', methods=['GET'])
@auth_required
def get_audit_logs():
    current_user = get_current_user()
    action = request.args.get('action')
    doc_id = request.args.get('documentId')
    user_id = request.args.get('userId')
    limit = int(request.args.get('limit', 100))
    offset = int(request.args.get('offset', 0))

    query = AuditLog.query.filter_by(organization_id=current_user.organization_id)

    if action and action != 'all':
        query = query.filter_by(action=action)
    if doc_id:
        query = query.filter_by(document_id=doc_id)
    if user_id:
        query = query.filter_by(user_id=user_id)

    total = query.count()
    logs = query.order_by(AuditLog.sequence_num.desc()).limit(limit).offset(offset).all()

    return jsonify({
        'success': True,
        'total': total,
        'logs': [l.to_dict() for l in logs]
    }), 200

@audit_bp.route('/verify', methods=['POST'])
@auth_required
def verify_audit():
    report = AuditService.verify_audit_chain()
    return jsonify({
        'success': True,
        'report': report
    }), 200

@audit_bp.route('/simulate-tamper', methods=['POST'])
@auth_required
@admin_required
def simulate_tamper():
    """
    Simulates unauthorized audit log tampering (Admin Only).
    """
    data = request.get_json(silent=True) or {}
    sequence_num = data.get('sequenceNum')
    if sequence_num:
        try:
            sequence_num = int(sequence_num)
        except ValueError:
            sequence_num = None

    try:
        result = AuditService.simulate_audit_tamper(sequence_num=sequence_num)
        return jsonify({
            'success': True,
            'result': result
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400

@audit_bp.route('/repair', methods=['POST'])
@auth_required
@admin_required
def repair_tamper():
    """
    Restores tampered audit records to pristine cryptographic state (Admin Only).
    """
    try:
        result = AuditService.repair_audit_tamper()
        return jsonify({
            'success': True,
            'result': result
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
