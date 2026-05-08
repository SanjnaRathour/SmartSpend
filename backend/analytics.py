from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, extract
from models import db, Transaction, Category
from ml_service import ml_service

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")


@analytics_bp.get("/summary")
@jwt_required()
def summary():
    uid = int(get_jwt_identity())
    totals = db.session.query(
        Transaction.type, func.sum(Transaction.amount)
    ).filter_by(user_id=uid).group_by(Transaction.type).all()
    result = {t: float(s) for t, s in totals}
    return jsonify({
        "income": result.get("income", 0),
        "expense": result.get("expense", 0),
        "balance": result.get("income", 0) - result.get("expense", 0),
    })


@analytics_bp.get("/by-category")
@jwt_required()
def by_category():
    uid = int(get_jwt_identity())
    rows = db.session.query(
        Category.name, func.sum(Transaction.amount)
    ).outerjoin(Category, Transaction.cat_id == Category.cat_id)\
     .filter(Transaction.user_id == uid, Transaction.type == "expense")\
     .group_by(Category.name).all()
    return jsonify([{"category": c or "Uncategorized", "total": float(t)} for c, t in rows])


@analytics_bp.get("/monthly-trend")
@jwt_required()
def monthly_trend():
    uid = int(get_jwt_identity())
    rows = db.session.query(
        extract("year", Transaction.txn_date),
        extract("month", Transaction.txn_date),
        Transaction.type,
        func.sum(Transaction.amount),
    ).filter_by(user_id=uid).group_by(
        extract("year", Transaction.txn_date),
        extract("month", Transaction.txn_date),
        Transaction.type,
    ).order_by(
        extract("year", Transaction.txn_date),
        extract("month", Transaction.txn_date),
    ).all()
    return jsonify([
        {"year": int(y), "month": int(m), "type": t, "total": float(s)}
        for y, m, t, s in rows
    ])


@analytics_bp.get("/forecast")
@jwt_required()
def forecast():
    uid = int(get_jwt_identity())
    history = db.session.query(
        Transaction.txn_date, func.sum(Transaction.amount)
    ).filter_by(user_id=uid, type="expense")\
     .group_by(Transaction.txn_date).order_by(Transaction.txn_date).all()
    series = [(d.isoformat(), float(a)) for d, a in history]
    return jsonify(ml_service.forecast(series, periods=30))


@analytics_bp.get("/anomalies")
@jwt_required()
def anomalies():
    uid = int(get_jwt_identity())
    flagged = Transaction.query.filter_by(user_id=uid, is_anomaly=True)\
        .order_by(Transaction.txn_date.desc()).all()

    median_amt = db.session.query(func.avg(Transaction.amount))\
        .filter_by(user_id=uid, type="expense").scalar() or 0

    total_expense = db.session.query(func.sum(Transaction.amount))\
        .filter_by(user_id=uid, type="expense").scalar() or 0

    flagged_amount = sum(float(t.amount) for t in flagged)
    items = [t.to_dict() for t in flagged]

    return jsonify({
        "items": items,
        "stats": {
            "count": len(flagged),
            "total_amount": round(flagged_amount, 2),
            "typical_expense": round(float(median_amt), 2),
            "percent_of_spend": round((flagged_amount / float(total_expense) * 100), 1) if total_expense else 0.0,
        },
    })
