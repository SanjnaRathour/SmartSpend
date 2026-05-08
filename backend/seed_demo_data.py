"""Seed 3 demo accounts + sample data. Run: python seed_demo_data.py"""
import os
import random
import sys
from datetime import date, timedelta

import bcrypt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, User, Transaction, Category, Budget
from crypto_util import encrypt

random.seed(42)

TEMPLATES = [
    ("Food",          "Zomato biryani order",          (180, 450),   "expense", 8),
    ("Food",          "Swiggy dinner",                 (220, 600),   "expense", 6),
    ("Food",          "Domino's pizza",                (400, 900),   "expense", 3),
    ("Food",          "Starbucks coffee",              (180, 380),   "expense", 4),
    ("Transport",     "Uber ride to office",           (120, 300),   "expense", 10),
    ("Transport",     "Metro recharge",                (200, 500),   "expense", 2),
    ("Transport",     "Ola airport drop",              (500, 1200),  "expense", 1),
    ("Shopping",      "Amazon electronics",            (800, 3500),  "expense", 3),
    ("Shopping",      "Flipkart apparel",              (600, 2400),  "expense", 2),
    ("Shopping",      "Myntra sale",                   (1200, 3200), "expense", 1),
    ("Bills",         "Electricity bill",              (1400, 2800), "expense", 1),
    ("Bills",         "Airtel mobile recharge",        (299, 499),   "expense", 1),
    ("Bills",         "Jio fiber broadband",           (699, 999),   "expense", 1),
    ("Entertainment", "Netflix subscription",          (499, 649),   "expense", 1),
    ("Entertainment", "BookMyShow movie",              (300, 800),   "expense", 2),
    ("Entertainment", "Spotify premium",               (119, 179),   "expense", 1),
    ("Healthcare",    "Apollo pharmacy",               (200, 800),   "expense", 2),
    ("Education",     "Coursera course",               (999, 2499),  "expense", 1),
    ("Investment",    "Zerodha SIP",                   (5000, 10000),"expense", 1),
    ("Salary",        "Monthly salary credit",         (65000, 65000),"income", 1),
]


def _hash(pw):
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt(12)).decode()


def _ensure_user(email, name, password, role="user"):
    user = User.query.filter_by(email=email).first()
    if user:
        return user, False
    user = User(name=name, email=email, password_hash=_hash(password), role=role)
    db.session.add(user)
    db.session.flush()
    return user, True


def _category(name):
    return Category.query.filter_by(name=name).first()


def _clear_demo_data(user_id):
    Transaction.query.filter_by(user_id=user_id).delete()
    Budget.query.filter_by(user_id=user_id).delete()


def _seed_demo_transactions(user):
    today = date.today()
    start = today - timedelta(days=60)
    count = 0
    for cat_name, desc, amt_range, ttype, per_month in TEMPLATES:
        cat = _category(cat_name)
        if not cat:
            continue
        for _ in range(per_month * 2):
            offset = random.randint(0, 60)
            txn_date = start + timedelta(days=offset)
            if txn_date > today:
                txn_date = today
            amount = round(random.uniform(*amt_range), 2)
            db.session.add(Transaction(
                user_id=user.user_id, cat_id=cat.cat_id,
                amount=amount, type=ttype, description=encrypt(desc),
                txn_date=txn_date, is_anomaly=False,
                confidence=round(random.uniform(0.82, 0.99), 3),
            ))
            count += 1

    anomalies = [
        (date.today() - timedelta(days=3),  "Unfamiliar merchant — luxury watch",  74500.00, "Shopping"),
        (date.today() - timedelta(days=18), "Late-night large cash withdrawal",    48000.00, "Other"),
    ]
    for d, desc, amt, cat_name in anomalies:
        cat = _category(cat_name) or _category("Other")
        db.session.add(Transaction(
            user_id=user.user_id, cat_id=cat.cat_id if cat else None,
            amount=amt, type="expense", description=encrypt(desc),
            txn_date=d, is_anomaly=True, confidence=0.95,
        ))
        count += 1
    return count


def _seed_budgets(user):
    month = date.today().replace(day=1)
    plans = [("Food", 8000), ("Transport", 4000), ("Shopping", 6000),
             ("Bills", 5000), ("Entertainment", 2500)]
    for cat_name, limit in plans:
        cat = _category(cat_name)
        if cat:
            db.session.add(Budget(
                user_id=user.user_id, cat_id=cat.cat_id,
                limit_amt=limit, month=month,
            ))


def main():
    app = create_app()
    with app.app_context():
        admin, created_admin = _ensure_user(
            "admin@smartspend.local", "Admin User", "Demo@1234", role="admin"
        )
        print(f"[admin] {'created' if created_admin else 'exists'} (id={admin.user_id})")

        demo, created_demo = _ensure_user(
            "demo@smartspend.local", "Demo User", "Demo@1234"
        )
        _clear_demo_data(demo.user_id)
        count = _seed_demo_transactions(demo)
        _seed_budgets(demo)
        print(f"[demo]  {'created' if created_demo else 'exists'} (id={demo.user_id}) — {count} txns + 5 budgets")

        demo2, created_demo2 = _ensure_user(
            "demo2@smartspend.local", "Demo User 2", "Demo@1234"
        )
        print(f"[demo2] {'created' if created_demo2 else 'exists'} (id={demo2.user_id}) — empty")

        db.session.commit()
        print("\nAll passwords: Demo@1234")


if __name__ == "__main__":
    main()
