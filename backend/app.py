from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from config import Config
from models import db
from auth import auth_bp
from transactions import txn_bp
from analytics import analytics_bp
from admin import admin_bp
from budgets import budgets_bp
from scheduler import start_scheduler


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    JWTManager(app)
    CORS(app, origins=[Config.CORS_ORIGIN])
    Limiter(app=app, key_func=get_remote_address,
            default_limits=["100 per minute"])

    app.register_blueprint(auth_bp)
    app.register_blueprint(txn_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(budgets_bp)

    # Background 12h retrain scheduler (opt-in via env var)
    start_scheduler(app)

    @app.after_request
    def security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=()"
        return response

    @app.get("/")
    def health():
        return jsonify({"status": "ok", "service": "SmartSpend API"})

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "not found"}), 404

    @app.errorhandler(500)
    def server_err(e):
        return jsonify({"error": "internal error"}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
