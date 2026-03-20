-- NOTE:
-- This project uses JPA ddl-auto=update for schema evolution.
-- Keep this file minimal and portable: only CREATE TABLE IF NOT EXISTS statements.
-- Avoid PostgreSQL DO $$ blocks because Spring's SQL initializer may split scripts.

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    balance DOUBLE PRECISION,
    account_locked BOOLEAN NOT NULL DEFAULT FALSE,
    phone VARCHAR(15),
    bank_name VARCHAR(120),
    bank_account_number VARCHAR(30),
    bank_ifsc VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    location VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    timestamp TIMESTAMP,
    fraud_status VARCHAR(30) NOT NULL,
    risk_score DOUBLE PRECISION NOT NULL,
    transaction_status VARCHAR(30) NOT NULL,
    status VARCHAR(30),
    fraud_reason VARCHAR(500),
    ip_address VARCHAR(64),
    device_type VARCHAR(100),
    device_id VARCHAR(120),
    recipient_phone VARCHAR(15),
    payment_method VARCHAR(30),
    upi_vpa VARCHAR(100),
    merchant_name VARCHAR(120),
    payment_reference VARCHAR(64),
    payment_status VARCHAR(30) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    channel VARCHAR(30) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    fraud_case_id BIGINT,
    transaction_id BIGINT,
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(30) NOT NULL,
    sent_at TIMESTAMP,
    failed_reason VARCHAR(500),
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- SLA Configuration table
CREATE TABLE IF NOT EXISTS sla_configuration (
    id BIGSERIAL PRIMARY KEY,
    risk_level VARCHAR(20) UNIQUE NOT NULL,
    escalation_minutes INT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    description VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Complaints / disputes table
CREATE TABLE IF NOT EXISTS complaints (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    transaction_id BIGINT NOT NULL,
    description VARCHAR(1000) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

