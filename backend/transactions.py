import csv
import io
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from models import db, Transaction, Category
from ml_service import ml_service
from crypto_util import encrypt

txn_bp = Blueprint("transactions", __name__, url_prefix="/api/transactions")


def _resolve_category(name):
    if not name:
        return None
    cat = Category.query.filter_by(name=name).first()
    if not cat:
        try:
            cat = Category(name=name)
            db.session.add(cat)
            db.session.flush()
        except IntegrityError:
            db.session.rollback()
            cat = Category.query.filter_by(name=name).first()
    return cat


@txn_bp.post("/")
@jwt_required()
def create_txn():
    uid = int(get_jwt_identity())
    data = request.get_json() or {}
    try:
        amount = float(data["amount"])
        ttype = data["type"]
        txn_date = datetime.strptime(data["txn_date"], "%Y-%m-%d").date()
        description = data.get("description", "")
    except (KeyError, ValueError) as e:
        return jsonify({"error": f"invalid input: {e}"}), 400

    if ttype not in ("income", "expense"):
        return jsonify({"error": "type must be income or expense"}), 400

    # ML auto-categorization
    predicted = data.get("category") or ml_service.predict_category(description)
    confidence = ml_service.last_confidence
    cat = _resolve_category(predicted)

    # Fraud detection
    is_anomaly = ml_service.detect_anomaly({
        "amount": amount,
        "hour": datetime.now().hour,
        "day_of_week": txn_date.weekday(),
    })

    txn = Transaction(
        user_id=uid, cat_id=cat.cat_id if cat else None,
        amount=amount, type=ttype, description=encrypt(description),
        txn_date=txn_date, is_anomaly=is_anomaly, confidence=confidence,
    )
    db.session.add(txn)
    db.session.commit()
    return jsonify(txn.to_dict()), 201


@txn_bp.get("/")
@jwt_required()
def list_txns():
    uid = int(get_jwt_identity())
    page = int(request.args.get("page", 1))
    per_page = min(int(request.args.get("per_page", 20)), 100)
    q = Transaction.query.filter_by(user_id=uid).order_by(Transaction.txn_date.desc())
    total = q.count()
    rows = q.offset((page - 1) * per_page).limit(per_page).all()
    return jsonify({
        "total": total, "page": page, "per_page": per_page,
        "items": [r.to_dict() for r in rows],
    })


@txn_bp.delete("/<int:txn_id>")
@jwt_required()
def delete_txn(txn_id):
    uid = int(get_jwt_identity())
    txn = Transaction.query.filter_by(txn_id=txn_id, user_id=uid).first()
    if not txn:
        return jsonify({"error": "not found"}), 404
    db.session.delete(txn)
    db.session.commit()
    return jsonify({"message": "deleted"})


@txn_bp.patch("/<int:txn_id>")
@jwt_required()
def update_txn(txn_id):
    uid = int(get_jwt_identity())
    txn = Transaction.query.filter_by(txn_id=txn_id, user_id=uid).first()
    if not txn:
        return jsonify({"error": "not found"}), 404

    data = request.get_json() or {}
    if "amount" in data:
        try: txn.amount = float(data["amount"])
        except ValueError: return jsonify({"error": "invalid amount"}), 400
    if "type" in data and data["type"] in ("income", "expense"):
        txn.type = data["type"]
    if "description" in data:
        from crypto_util import encrypt
        txn.description = encrypt(data["description"])
    if "txn_date" in data:
        try: txn.txn_date = datetime.strptime(data["txn_date"], "%Y-%m-%d").date()
        except ValueError: return jsonify({"error": "invalid txn_date"}), 400
    if "category" in data:
        cat = _resolve_category(data["category"])
        txn.cat_id = cat.cat_id if cat else None
    if "is_anomaly" in data:
        txn.is_anomaly = bool(data["is_anomaly"])

    db.session.commit()
    return jsonify(txn.to_dict())


@txn_bp.get("/export")
@jwt_required()
def export_csv():
    """Export all user transactions as a downloadable CSV."""
    from flask import Response
    uid = int(get_jwt_identity())
    rows = Transaction.query.filter_by(user_id=uid).order_by(Transaction.txn_date.desc()).all()

    def generate():
        yield "txn_date,amount,type,category,description,is_anomaly\n"
        for t in rows:
            d = t.to_dict()
            desc = (d["description"] or "").replace('"', '""')
            cat = d["category"] or ""
            yield f'{d["txn_date"]},{d["amount"]},{d["type"]},{cat},"{desc}",{d["is_anomaly"]}\n'

    return Response(generate(), mimetype="text/csv", headers={
        "Content-Disposition": f"attachment; filename=smartspend_export_{datetime.utcnow().date()}.csv",
    })


@txn_bp.post("/import")
@jwt_required()
def import_csv():
    uid = int(get_jwt_identity())
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "file required"}), 400
    if request.content_length and request.content_length > 5 * 1024 * 1024:
        return jsonify({"error": "file too large (max 5MB)"}), 400

    reader = csv.DictReader(io.StringIO(file.read().decode("utf-8")))
    inserted, errors = 0, []
    for i, row in enumerate(reader, start=2):
        try:
            amount = float(row["amount"])
            ttype = row["type"]
            if ttype not in ("income", "expense"):
                errors.append(f"row {i}: type must be income or expense, got '{ttype}'")
                continue
            txn_date = datetime.strptime(row["txn_date"], "%Y-%m-%d").date()
            desc = row.get("description", "")
            category_name = row.get("category", "").strip() or ml_service.predict_category(desc)
            cat = _resolve_category(category_name)
            db.session.add(Transaction(
                user_id=uid, cat_id=cat.cat_id if cat else None,
                amount=amount, type=ttype, description=encrypt(desc), txn_date=txn_date,
            ))
            inserted += 1
        except Exception as e:
            errors.append(f"row {i}: {e}")
    db.session.commit()
    return jsonify({"inserted": inserted, "errors": errors})
