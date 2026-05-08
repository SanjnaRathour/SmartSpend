import pytest
from app import create_app
from models import db


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    with app.app_context():
        db.create_all()
        yield app.test_client()


def test_register_success(client):
    r = client.post("/api/auth/register", json={
        "name": "Alice", "email": "alice@test.com", "password": "Strong1Pass",
    })
    assert r.status_code == 201
    assert r.get_json()["user"]["email"] == "alice@test.com"


def test_register_weak_password(client):
    r = client.post("/api/auth/register", json={
        "name": "Bob", "email": "bob@test.com", "password": "weak",
    })
    assert r.status_code == 400


def test_register_invalid_email(client):
    r = client.post("/api/auth/register", json={
        "name": "X", "email": "bad-email", "password": "Strong1Pass",
    })
    assert r.status_code == 400


def test_duplicate_email(client):
    payload = {"name": "A", "email": "a@test.com", "password": "Strong1Pass"}
    client.post("/api/auth/register", json=payload)
    r = client.post("/api/auth/register", json=payload)
    assert r.status_code == 409


def test_login_success(client):
    client.post("/api/auth/register", json={
        "name": "C", "email": "c@test.com", "password": "Strong1Pass",
    })
    r = client.post("/api/auth/login", json={
        "email": "c@test.com", "password": "Strong1Pass",
    })
    assert r.status_code == 200
    assert "token" in r.get_json()


def test_login_bad_password(client):
    client.post("/api/auth/register", json={
        "name": "D", "email": "d@test.com", "password": "Strong1Pass",
    })
    r = client.post("/api/auth/login", json={
        "email": "d@test.com", "password": "WrongPass1",
    })
    assert r.status_code == 401
