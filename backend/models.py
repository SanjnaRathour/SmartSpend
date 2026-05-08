from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"
    user_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default="user")
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    transactions = db.relationship("Transaction", backref="user", cascade="all,delete")

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
        }


class Category(db.Model):
    __tablename__ = "categories"
    cat_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    icon = db.Column(db.String(50))


class Transaction(db.Model):
    __tablename__ = "transactions"
    txn_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)
    cat_id = db.Column(db.Integer, db.ForeignKey("categories.cat_id"))
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    type = db.Column(db.String(10), nullable=False)
    description = db.Column(db.Text)  # ENCRYPTED at rest via crypto_util
    txn_date = db.Column(db.Date, nullable=False)
    is_anomaly = db.Column(db.Boolean, default=False)
    confidence = db.Column(db.Numeric(4, 3))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    category = db.relationship("Category")

    def to_dict(self):
        from crypto_util import decrypt
        return {
            "txn_id": self.txn_id,
            "amount": float(self.amount),
            "type": self.type,
            "description": decrypt(self.description),
            "txn_date": self.txn_date.isoformat(),
            "category": self.category.name if self.category else None,
            "is_anomaly": self.is_anomaly,
            "anomaly_reason": _explain_anomaly(self) if self.is_anomaly else None,
            "confidence": float(self.confidence) if self.confidence else None,
        }


def _explain_anomaly(txn):
    amt = float(txn.amount)
    reasons = []
    if amt >= 50000:
        reasons.append(f"Very large amount (₹{amt:,.0f}) — {amt / 500:.0f}× typical daily spend")
    elif amt >= 15000:
        reasons.append(f"Higher than typical amount (₹{amt:,.0f})")
    if txn.category and txn.category.name in ("Other", "Shopping") and amt > 20000:
        reasons.append(f"Unusual merchant category for this amount ({txn.category.name})")
    weekday = txn.txn_date.weekday()
    if weekday in (5, 6) and amt >= 30000:
        reasons.append("Large transaction on a weekend — atypical pattern")
    if not reasons:
        reasons.append("ML model flagged unusual feature combination (amount, timing, merchant)")
    return " · ".join(reasons)


class Budget(db.Model):
    __tablename__ = "budgets"
    budget_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)
    cat_id = db.Column(db.Integer, db.ForeignKey("categories.cat_id"), nullable=False)
    limit_amt = db.Column(db.Numeric(12, 2), nullable=False)
    month = db.Column(db.Date, nullable=False)


class AuditLog(db.Model):
    __tablename__ = "audit_logs"
    log_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"))
    action = db.Column(db.String(100), nullable=False)
    ip_address = db.Column(db.String(45))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
