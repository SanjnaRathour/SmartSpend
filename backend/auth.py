import re
import bcrypt
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User, AuditLog

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PASS_RE = re.compile(r"^(?=.*[A-Z])(?=.*\d).{8,}$")


def _log(user_id, action):
    db.session.add(
        AuditLog(user_id=user_id, action=action, ip_address=request.remote_addr)
    )
    db.session.commit()


@auth_bp.post("/register")
def register():
    data = request.get_json() or {}
    name, email, password = data.get("name"), data.get("email"), data.get("password")

    if not all([name, email, password]):
        return jsonify({"error": "name, email, password required"}), 400
    if not EMAIL_RE.match(email):
        return jsonify({"error": "invalid email"}), 400
    if not PASS_RE.match(password):
        return jsonify({"error": "password must be >=8 chars, 1 uppercase, 1 digit"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "email already registered"}), 409

    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()
    user = User(name=name, email=email, password_hash=pw_hash)
    db.session.add(user)
    db.session.commit()
    _log(user.user_id, "register")
    return jsonify({"message": "registered", "user": user.to_dict()}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json() or {}
    email, password = data.get("email"), data.get("password")
    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        return jsonify({"error": "invalid credentials"}), 401
    if not user.is_active:
        return jsonify({"error": "account disabled"}), 403

    token = create_access_token(identity=str(user.user_id),
                                additional_claims={"role": user.role})
    _log(user.user_id, "login")
    return jsonify({"token": token, "user": user.to_dict()})


@auth_bp.get("/me")
@jwt_required()
def me():
    user = User.query.get(int(get_jwt_identity()))
    return jsonify(user.to_dict())


@auth_bp.patch("/me")
@jwt_required()
def update_me():
    user = User.query.get(int(get_jwt_identity()))
    data = request.get_json() or {}
    if "name" in data and data["name"].strip():
        user.name = data["name"].strip()
    db.session.commit()
    _log(user.user_id, "profile_update")
    return jsonify(user.to_dict())


@auth_bp.post("/change-password")
@jwt_required()
def change_password():
    user = User.query.get(int(get_jwt_identity()))
    data = request.get_json() or {}
    current_pw = data.get("current_password", "")
    new_pw = data.get("new_password", "")

    if not bcrypt.checkpw(current_pw.encode(), user.password_hash.encode()):
        return jsonify({"error": "current password is incorrect"}), 401
    if not PASS_RE.match(new_pw):
        return jsonify({"error": "new password must be >=8 chars, 1 uppercase, 1 digit"}), 400

    user.password_hash = bcrypt.hashpw(new_pw.encode(), bcrypt.gensalt(12)).decode()
    db.session.commit()
    _log(user.user_id, "password_change")
    return jsonify({"message": "password updated"})
