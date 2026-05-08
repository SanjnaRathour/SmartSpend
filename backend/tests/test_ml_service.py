from ml_service import MLService


def test_keyword_fallback_food():
    ml = MLService()
    assert ml.predict_category("zomato biryani order") == "Food"


def test_keyword_fallback_transport():
    ml = MLService()
    assert ml.predict_category("uber ride to airport") == "Transport"


def test_keyword_fallback_other():
    ml = MLService()
    assert ml.predict_category("random xyz string") == "Other"


def test_empty_description():
    ml = MLService()
    assert ml.predict_category("") == "Other"


def test_anomaly_fallback_high_amount():
    ml = MLService()
    assert ml.detect_anomaly({"amount": 75000, "hour": 12, "day_of_week": 3}) is True


def test_anomaly_fallback_normal_amount():
    ml = MLService()
    assert ml.detect_anomaly({"amount": 500, "hour": 12, "day_of_week": 3}) is False


def test_forecast_insufficient_history():
    ml = MLService()
    result = ml.forecast([("2026-04-01", 100)], periods=30)
    assert "error" in result
