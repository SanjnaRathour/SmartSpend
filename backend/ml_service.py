"""
SmartSpend ML Service
---------------------
Wraps 3 ML models:
  1. Category classifier (TF-IDF + Logistic Regression)
  2. Spend forecaster (Prophet)
  3. Anomaly detector (Isolation Forest)

Models are trained via ml/train_models.py and loaded here as .pkl files.
Falls back to sensible defaults if model files are missing.
"""
import os
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "ml", "models")


class MLService:
    def __init__(self):
        self.last_confidence = None
        self.categorizer = self._load("categorizer.pkl")
        self.anomaly_model = self._load("anomaly.pkl")
        # Prophet loaded per-request because it's user-specific

    @staticmethod
    def _load(name):
        path = os.path.join(MODEL_DIR, name)
        if os.path.exists(path):
            try:
                return joblib.load(path)
            except Exception as e:
                print(f"[ML] Failed loading {name}: {e}")
        return None

    # ---------- 1. CATEGORY CLASSIFIER ----------
    _CONFIDENCE_THRESHOLD = 0.40

    def predict_category(self, description: str) -> str:
        if not description:
            self.last_confidence = 0.0
            return "Other"

        if self.categorizer is None:
            self.last_confidence = 0.5
            return self._keyword_fallback(description)

        pred = self.categorizer.predict([description])[0]
        proba = self.categorizer.predict_proba([description])[0]
        self.last_confidence = float(np.max(proba))

        if self.last_confidence < self._CONFIDENCE_THRESHOLD:
            keyword_pred = self._keyword_fallback(description)
            return keyword_pred

        return str(pred)

    @staticmethod
    def _keyword_fallback(text: str) -> str:
        text = text.lower()
        rules = {
            "Food": ["zomato", "swiggy", "restaurant", "cafe", "pizza", "food", "biryani",
                     "barbeque", "bbq", "lunch", "dinner", "breakfast", "snack", "chai", "tea"],
            "Transport": ["uber", "ola", "metro", "fuel", "petrol", "diesel", "taxi",
                          "bus", "train", "rapido", "auto", "parking", "toll"],
            "Shopping": ["amazon", "flipkart", "myntra", "mall", "store", "dress", "shirt",
                         "clothing", "clothes", "fashion", "boutique", "saree", "kurta",
                         "jeans", "shoes", "footwear", "bag", "handbag", "jewellery",
                         "watch", "accessory", "accessories", "meesho", "ajio", "nykaa"],
            "Bills": ["electricity", "water", "gas", "internet", "wifi", "rent",
                      "broadband", "mobile recharge", "recharge", "insurance", "emi", "loan"],
            "Entertainment": ["netflix", "spotify", "movie", "cinema", "pvr", "inox",
                               "gaming", "game", "concert", "event", "show", "ott", "prime"],
            "Healthcare": ["pharmacy", "hospital", "doctor", "medicine", "apollo",
                           "medplus", "1mg", "diagnostic", "clinic", "health", "dental"],
            "Education": ["school", "college", "tuition", "course", "udemy", "coursera",
                          "books", "stationery", "exam", "fees", "library"],
            "Salary": ["salary", "payroll", "credit"],
        }
        for cat, kws in rules.items():
            if any(k in text for k in kws):
                return cat
        return "Other"

    # ---------- 2. ANOMALY DETECTOR ----------
    def detect_anomaly(self, features: dict) -> bool:
        if self.anomaly_model is None:
            return features.get("amount", 0) > 50000  # naive fallback
        X = pd.DataFrame([features])
        pred = self.anomaly_model.predict(X)
        return bool(pred[0] == -1)

    # ---------- 3. SPEND FORECASTER ----------
    def forecast(self, history: list, periods: int = 30) -> dict:
        if not history or len(history) < 14:
            return {"error": "need at least 14 days of history",
                    "forecast": []}

        history_payload = [
            {"date": d, "amount": round(float(a), 2)} for d, a in history[-30:]
        ]
        try:
            from prophet import Prophet
            df = pd.DataFrame(history, columns=["ds", "y"])
            df["ds"] = pd.to_datetime(df["ds"])
            m = Prophet(daily_seasonality=False, weekly_seasonality=True,
                        yearly_seasonality=False)
            m.fit(df)
            future = m.make_future_dataframe(periods=periods)
            fc = m.predict(future)[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(periods)
            payload = {
                "forecast": [
                    {"date": d.strftime("%Y-%m-%d"),
                     "predicted": round(float(y), 2),
                     "lower": round(float(lo), 2),
                     "upper": round(float(hi), 2)}
                    for d, y, lo, hi in fc.itertuples(index=False)
                ],
                "total_predicted": round(float(fc["yhat"].sum()), 2),
                "model": "prophet",
            }
        except Exception as e:
            print(f"[ML] Prophet unavailable ({e}) — using trend-aware fallback")
            payload = self._naive_forecast(history, periods)
            payload["model"] = "moving-average"

        payload["history"] = history_payload
        recent = [a for _, a in history[-30:]]
        payload["history_total"] = round(sum(recent), 2) if recent else 0
        payload["daily_avg"] = round(sum(recent) / len(recent), 2) if recent else 0
        return payload

    @staticmethod
    def _naive_forecast(history, periods):
        """Trend-aware linear forecast when Prophet is unavailable."""
        recent = [a for _, a in history[-30:]]
        if not recent:
            return {"forecast": [], "total_predicted": 0.0}

        n = len(recent)
        x = np.arange(n, dtype=float)
        y = np.array(recent, dtype=float)
        slope, intercept = np.polyfit(x, y, 1)
        residual_std = float(np.std(y - (slope * x + intercept))) or max(np.mean(y) * 0.15, 1.0)

        last_date = history[-1][0]
        start = datetime.strptime(last_date, "%Y-%m-%d") + timedelta(days=1)
        forecast = []
        total = 0.0
        for i in range(periods):
            pred = max(0.0, float(slope * (n + i) + intercept))
            lo = max(0.0, pred - 1.2 * residual_std)
            hi = pred + 1.2 * residual_std
            forecast.append({
                "date": (start + timedelta(days=i)).strftime("%Y-%m-%d"),
                "predicted": round(pred, 2),
                "lower": round(lo, 2),
                "upper": round(hi, 2),
            })
            total += pred
        return {"forecast": forecast, "total_predicted": round(total, 2)}


ml_service = MLService()
