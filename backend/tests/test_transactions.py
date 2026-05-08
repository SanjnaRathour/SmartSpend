import pytest
from app import create_app
from models import db


@pytest.fixture
def authed_client():
    app = create_app()
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    with app.app_context():
        db.create_all()
        c = app.test_client()
        c.post("/api/auth/register", json={
            "name": "T", "email": "t@test.com", "password": "Strong1Pass",
        })
        r = c.post("/api/auth/login", json={
            "email": "t@test.com", "password": "Strong1Pass",
        })
        token = r.get_json()["token"]
        c.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {token}"
        yield c


def test_create_txn(authed_client):
    r = authed_client.post("/api/transactions/", json={
        "amount": 250, "type": "expense",
        "description": "zomato dinner", "txn_date": "2026-04-10",
    })
    assert r.status_code == 201
    data = r.get_json()
    assert data["amount"] == 250
    assert data["category"] in ("Food", "Other")


def test_list_txns(authed_client):
    authed_client.post("/api/transactions/", json={
        "amount": 100, "type": "expense",
        "description": "test", "txn_date": "2026-04-10",
    })
    r = authed_client.get("/api/transactions/")
    assert r.status_code == 200
    assert r.get_json()["total"] >= 1


def test_invalid_type(authed_client):
    r = authed_client.post("/api/transactions/", json={
        "amount": 100, "type": "INVALID",
        "description": "x", "txn_date": "2026-04-10",
    })
    assert r.status_code == 400


def test_unauthenticated_blocked():
    app = create_app()
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    with app.app_context():
        db.create_all()
        c = app.test_client()
        r = c.get("/api/transactions/")
        assert r.status_code == 401
