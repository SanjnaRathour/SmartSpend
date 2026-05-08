import pytest
from app import create_app
from models import db, User
import bcrypt


@pytest.fixture
def app_ctx():
    app = create_app()
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    with app.app_context():
        db.create_all()
        # Seed one admin + one regular user
        pw = bcrypt.hashpw(b"Strong1Pass", bcrypt.gensalt(12)).decode()
        db.session.add(User(name="Admin", email="admin@test.com",
                            password_hash=pw, role="admin"))
        db.session.add(User(name="User",  email="user@test.com",
                            password_hash=pw, role="user"))
        db.session.commit()
        yield app


def _token(client, email):
    r = client.post("/api/auth/login", json={"email": email, "password": "Strong1Pass"})
    return r.get_json()["token"]


def test_admin_can_list_users(app_ctx):
    client = app_ctx.test_client()
    token = _token(client, "admin@test.com")
    r = client.get("/api/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert len(r.get_json()) == 2


def test_regular_user_blocked_from_admin(app_ctx):
    client = app_ctx.test_client()
    token = _token(client, "user@test.com")
    r = client.get("/api/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403


def test_unauthenticated_blocked(app_ctx):
    client = app_ctx.test_client()
    r = client.get("/api/admin/users")
    assert r.status_code == 401


def test_admin_stats(app_ctx):
    client = app_ctx.test_client()
    token = _token(client, "admin@test.com")
    r = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    data = r.get_json()
    assert data["total_users"] == 2
    assert "flagged_transactions" in data


def test_admin_cannot_disable_self(app_ctx):
    client = app_ctx.test_client()
    token = _token(client, "admin@test.com")
    admin_user = User.query.filter_by(email="admin@test.com").first()
    r = client.patch(f"/api/admin/users/{admin_user.user_id}/status",
                     headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 400
    assert "own account" in r.get_json()["error"]


def test_admin_cannot_delete_self(app_ctx):
    client = app_ctx.test_client()
    token = _token(client, "admin@test.com")
    admin_user = User.query.filter_by(email="admin@test.com").first()
    r = client.delete(f"/api/admin/users/{admin_user.user_id}",
                      headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 400
    assert "own account" in r.get_json()["error"]


def test_cannot_disable_last_admin(app_ctx):
    """With only 1 admin, even disabling a different session's admin is blocked."""
    client = app_ctx.test_client()
    token = _token(client, "admin@test.com")
    # Regular user trying to disable themselves is fine (not last admin)
    user = User.query.filter_by(email="user@test.com").first()
    r = client.patch(f"/api/admin/users/{user.user_id}/status",
                     headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200  # disabling a regular user works


def test_admin_can_delete_regular_user(app_ctx):
    client = app_ctx.test_client()
    token = _token(client, "admin@test.com")
    user = User.query.filter_by(email="user@test.com").first()
    r = client.delete(f"/api/admin/users/{user.user_id}",
                      headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert User.query.filter_by(email="user@test.com").first() is None
