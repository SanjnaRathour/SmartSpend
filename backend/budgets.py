"""Monthly budget management per user per category."""
from datetime import datetime
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, extract
from models import db, Budget, Category, Transaction

budgets_bp = Blueprint("budgets", __name__, url_prefix="/api/budgets")


def _parse_month(s):
    """Accept '2026-04' or '2026-04-01' and return the first of the month."""
    if not s:
        return datetime.utcnow().date().replace(day=1)
    try:
        parts = s.split("-")
        return datetime(int(parts[0]), int(parts[1]), 1).date()
    except Exception:
        return None


@budgets_bp.get("/")
@jwt_required()
def list_budgets():
    uid = int(get_jwt_identity())
    month = _parse_month(request.args.get("month"))
    budgets = db.session.query(Budget, Category).join(
        Category, Budget.cat_id == Category.cat_id
    ).filter(Budget.user_id == uid, Budget.month == month).all()

    # Current-month spend per category for progress bars
    spent = dict(db.session.query(
        Transaction.cat_id, func.sum(Transaction.amount)
    ).filter(
        Transaction.user_id == uid, Transaction.type == "expense",
        extract("year",  Transaction.txn_date) == month.year,
        extract("month", Transaction.txn_date) == month.month,
    ).group_by(Transaction.cat_id).all())

    return jsonify([{
        "budget_id": b.budget_id,
        "cat_id": c.cat_id,
        "category": c.name,
        "limit_amt": float(b.limit_amt),
        "spent": float(spent.get(c.cat_id, 0) or 0),
        "month": b.month.isoformat(),
    } for b, c in budgets])


@budgets_bp.post("/")
@jwt_required()
def upsert_budget():
    uid = int(get_jwt_identity())
    data = request.get_json() or {}
    try:
        cat_id = int(data["cat_id"])
        limit_amt = float(data["limit_amt"])
        month = _parse_month(data.get("month"))
    except (KeyError, ValueError, TypeError):
        return jsonify({"error": "cat_id, limit_amt, month required"}), 400

    b = Budget.query.filter_by(user_id=uid, cat_id=cat_id, month=month).first()
    if b:
        b.limit_amt = limit_amt
    else:
        b = Budget(user_id=uid, cat_id=cat_id, limit_amt=limit_amt, month=month)
        db.session.add(b)
    db.session.commit()
    return jsonify({"budget_id": b.budget_id, "limit_amt": float(b.limit_amt)}), 200


@budgets_bp.delete("/<int:budget_id>")
@jwt_required()
def delete_budget(budget_id):
    uid = int(get_jwt_identity())
    b = Budget.query.filter_by(budget_id=budget_id, user_id=uid).first()
    if not b:
        return jsonify({"error": "not found"}), 404
    db.session.delete(b)
    db.session.commit()
    return jsonify({"message": "deleted"})


@budgets_bp.get("/categories")
@jwt_required()
def list_categories():
    cats = Category.query.order_by(Category.name).all()
    return jsonify([{"cat_id": c.cat_id, "name": c.name} for c in cats])
