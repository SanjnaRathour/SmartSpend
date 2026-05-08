"""Admin routes — role-protected."""
from functools import wraps
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from models import db, User, AuditLog, Transaction

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper


@admin_bp.get("/users")
@admin_required
def list_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([{
        **u.to_dict(),
        "is_active": u.is_active,
        "created_at": u.created_at.isoformat() if u.created_at else None,
        "txn_count": Transaction.query.filter_by(user_id=u.user_id).count(),
    } for u in users])


@admin_bp.patch("/users/<int:user_id>/status")
@admin_required
def toggle_user(user_id):
    current_uid = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    # Prevent self-disable
    if user.user_id == current_uid and user.is_active:
        return jsonify({
            "error": "you cannot disable your own account while logged in"
        }), 400

    # Prevent disabling the last active admin
    if user.role == "admin" and user.is_active:
        active_admins = User.query.filter_by(role="admin", is_active=True).count()
        if active_admins <= 1:
            return jsonify({
                "error": "cannot disable the last active admin. Promote another user first."
            }), 400

    user.is_active = not user.is_active
    db.session.commit()
    return jsonify({"user_id": user.user_id, "is_active": user.is_active})


@admin_bp.delete("/users/<int:user_id>")
@admin_required
def delete_user(user_id):
    current_uid = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    # Prevent self-delete
    if user.user_id == current_uid:
        return jsonify({
            "error": "you cannot delete your own account"
        }), 400

    # Prevent deleting the last admin (active or not)
    if user.role == "admin":
        total_admins = User.query.filter_by(role="admin").count()
        if total_admins <= 1:
            return jsonify({
                "error": "cannot delete the last admin account"
            }), 400

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "user deleted", "user_id": user_id})


@admin_bp.get("/audit-logs")
@admin_required
def audit_logs():
    limit = min(int(request.args.get("limit", 50)), 200)
    logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return jsonify([{
        "log_id": l.log_id,
        "user_id": l.user_id,
        "action": l.action,
        "ip_address": l.ip_address,
        "timestamp": l.timestamp.isoformat() if l.timestamp else None,
    } for l in logs])


@admin_bp.get("/stats")
@admin_required
def stats():
    return jsonify({
        "total_users": User.query.count(),
        "active_users": User.query.filter_by(is_active=True).count(),
        "total_transactions": Transaction.query.count(),
        "flagged_transactions": Transaction.query.filter_by(is_anomaly=True).count(),
    })


@admin_bp.post("/retrain")
@admin_required
def trigger_retrain():
    """Manually trigger ML retrain. Blocks until done (~30s)."""
    from scheduler import trigger_now
    result = trigger_now()
    return jsonify(result), 200 if result["status"] == "ok" else 500


@admin_bp.get("/model-info")
@admin_required
def model_info():
    """Return last-retrain status + next scheduled run."""
    from scheduler import get_status
    return jsonify(get_status())
