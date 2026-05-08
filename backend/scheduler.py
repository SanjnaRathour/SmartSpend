"""
Background retraining scheduler.
Runs the ML training pipeline every 12 hours using APScheduler.

Activated via the admin API (`POST /api/admin/retrain`) or automatically
when Flask starts (if SCHEDULER_ENABLED=true).
"""
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from apscheduler.schedulers.background import BackgroundScheduler

ML_SCRIPT = Path(__file__).resolve().parent.parent / "ml" / "train_models.py"

_scheduler: BackgroundScheduler | None = None
_last_run: dict = {"started_at": None, "finished_at": None, "status": "never", "output": ""}


def _run_training():
    """Invoke train_models.py in a subprocess and capture output."""
    global _last_run
    _last_run = {
        "started_at": datetime.utcnow().isoformat(),
        "finished_at": None, "status": "running", "output": "",
    }
    try:
        result = subprocess.run(
            [sys.executable, str(ML_SCRIPT)],
            capture_output=True, text=True, timeout=600,
            env={**os.environ, "PYTHONPATH": str(Path(__file__).resolve().parent)},
        )
        _last_run.update({
            "finished_at": datetime.utcnow().isoformat(),
            "status": "ok" if result.returncode == 0 else "failed",
            "output": (result.stdout + result.stderr)[-2000:],
        })
        print(f"[scheduler] Retrain {_last_run['status']}")
    except Exception as e:
        _last_run.update({
            "finished_at": datetime.utcnow().isoformat(),
            "status": "error", "output": str(e),
        })
        print(f"[scheduler] Retrain errored: {e}")

    # Hot-reload the ML service so the API picks up new models
    try:
        from ml_service import MLService
        import ml_service as _mod
        _mod.ml_service = MLService()
        print("[scheduler] MLService reloaded with fresh models")
    except Exception as e:
        print(f"[scheduler] ML reload failed: {e}")


def start_scheduler(app):
    """Start the 12-hour retrain job. Idempotent."""
    global _scheduler
    if os.getenv("SCHEDULER_ENABLED", "false").lower() != "true":
        app.logger.info("[scheduler] SCHEDULER_ENABLED != true — skipping")
        return
    if _scheduler and _scheduler.running:
        return

    _scheduler = BackgroundScheduler(daemon=True)
    _scheduler.add_job(_run_training, "interval", hours=12,
                       id="retrain_ml", replace_existing=True,
                       next_run_time=datetime.utcnow())  # first run at startup
    _scheduler.start()
    app.logger.info("[scheduler] Background retrain scheduled every 12 hours")


def trigger_now():
    """Manual trigger — safe to call from API."""
    _run_training()
    return _last_run


def get_status():
    return {
        **_last_run,
        "enabled": os.getenv("SCHEDULER_ENABLED", "false").lower() == "true",
        "interval_hours": 12,
        "next_run": _scheduler.get_job("retrain_ml").next_run_time.isoformat()
                    if _scheduler and _scheduler.get_job("retrain_ml") else None,
    }
