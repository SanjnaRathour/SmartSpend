# ML Module — SmartSpend

## Models

1. **`categorizer.pkl`** — TF-IDF + Logistic Regression for transaction category prediction
2. **`anomaly.pkl`** — Isolation Forest for fraud/anomaly detection
3. **Prophet** — Spend forecasting (trained per-user at request time, not serialised)

## Train

```bash
cd SmartSpend
pip install -r backend/requirements.txt
python ml/train_models.py
```

Outputs go to `ml/models/`.

## Replace synthetic data with real Kaggle data (optional)

Download:
- [Personal Finance Transactions](https://www.kaggle.com/datasets/)
- [Credit Card Fraud Detection](https://www.kaggle.com/mlg-ulb/creditcardfraud)

Place CSVs in `ml/data/` and edit `train_models.py` to read from them instead of synthetic.
