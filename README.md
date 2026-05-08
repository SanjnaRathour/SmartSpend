# SmartSpend

AI-powered personal finance web app — automatic transaction categorisation, 30-day spend forecast, and fraud/anomaly detection.

**Stack:** Flask · React · PostgreSQL · scikit-learn · Prophet · Isolation Forest · Docker

---

## Run with Docker (recommended)

```bash
docker compose up --build
```

Opens at **http://localhost:8080**. First build takes ~5 min.

---

## Run Manually

**Prerequisites:** Python 3.11+, Node 18+, PostgreSQL 15

**1. Backend**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # edit DATABASE_URL if needed
python3 app.py
```

**2. Frontend** *(new terminal)*
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Opens at **http://localhost:5173**

**3. Database** *(first time only)*
```bash
# create DB + user in psql
CREATE DATABASE smartspend;
CREATE USER smartspend WITH PASSWORD 'smartspend';
GRANT ALL PRIVILEGES ON DATABASE smartspend TO smartspend;

# load schema
psql -U smartspend -d smartspend -f backend/schema.sql
```

**4. Train ML models**
```bash
python3 ml/train_models.py
```

**5. Seed demo data**
```bash
cd backend && source venv/bin/activate
python3 seed_demo_data.py
```

---

## Demo Accounts

| Role | Email | Password | Data |
|------|-------|----------|------|
| Admin | `admin@smartspend.local` | `Demo@1234` | — |
| User | `demo@smartspend.local` | `Demo@1234` | ~45 txns, 5 budgets, 2 anomalies |
| Fresh | `demo2@smartspend.local` | `Demo@1234` | empty |

---

## Tests

```bash
cd backend && source venv/bin/activate
pytest tests/ -v
```

---

## Project Structure

```
SmartSpend/
├── backend/          Flask API, ML service, tests
├── frontend/         React + Tailwind SPA
├── ml/               Model training scripts + .pkl artifacts
├── SmartSpend_FULL_REPORT.docx   Project report (submission)
├── SmartSpend_FULL_REPORT.pptx   Presentation deck (viva)
└── docker-compose.yml
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port 5000 in use | `lsof -ti:5000 \| xargs kill` |
| `python` not found | Use `python3`, or `sudo apt install python-is-python3` |
| ML models not loading | Run `python3 ml/train_models.py` |
| Prophet install fails | Remove from `requirements.txt` — app falls back to linear forecast |
| PostgreSQL peer auth error | Run DB commands as `sudo -u postgres psql` |
