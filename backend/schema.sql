-- =========================================================
-- SmartSpend — Database Schema (PostgreSQL 15)
-- =========================================================

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ---------- USERS ----------
CREATE TABLE users (
    user_id       SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  DEFAULT 'user' CHECK (role IN ('user','admin')),
    is_active     BOOLEAN      DEFAULT TRUE,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ---------- CATEGORIES ----------
CREATE TABLE categories (
    cat_id   SERIAL PRIMARY KEY,
    name     VARCHAR(50) UNIQUE NOT NULL,
    icon     VARCHAR(50)
);

INSERT INTO categories (name, icon) VALUES
  ('Food',          'utensils'),
  ('Transport',     'car'),
  ('Shopping',      'shopping-bag'),
  ('Bills',         'file-invoice'),
  ('Entertainment', 'film'),
  ('Healthcare',    'heartbeat'),
  ('Education',     'graduation-cap'),
  ('Salary',        'wallet'),
  ('Investment',    'chart-line'),
  ('Other',         'ellipsis-h');

-- ---------- TRANSACTIONS ----------
CREATE TABLE transactions (
    txn_id       SERIAL PRIMARY KEY,
    user_id      INT     NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    cat_id       INT     REFERENCES categories(cat_id),
    amount       NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    type         VARCHAR(10) NOT NULL CHECK (type IN ('income','expense')),
    description  TEXT,
    txn_date     DATE NOT NULL,
    is_anomaly   BOOLEAN DEFAULT FALSE,
    confidence   NUMERIC(4,3),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_txn_user_date ON transactions(user_id, txn_date DESC);
CREATE INDEX idx_txn_category  ON transactions(cat_id);
CREATE INDEX idx_txn_anomaly   ON transactions(user_id, is_anomaly);

-- ---------- BUDGETS ----------
CREATE TABLE budgets (
    budget_id  SERIAL PRIMARY KEY,
    user_id    INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    cat_id     INT NOT NULL REFERENCES categories(cat_id),
    limit_amt  NUMERIC(12,2) NOT NULL CHECK (limit_amt >= 0),
    month      DATE NOT NULL,
    UNIQUE(user_id, cat_id, month)
);

-- ---------- AUDIT LOGS ----------
CREATE TABLE audit_logs (
    log_id     SERIAL PRIMARY KEY,
    user_id    INT REFERENCES users(user_id) ON DELETE SET NULL,
    action     VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    timestamp  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user_time ON audit_logs(user_id, timestamp DESC);

-- =========================================================
-- Users are created by backend/seed_demo_data.py
-- Run after schema loads to create admin + demo accounts
-- =========================================================
