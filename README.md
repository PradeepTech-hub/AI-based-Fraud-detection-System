# 🛡️ FraudGuard — AI-Based Fraud Detection System

FraudGuard is a full-stack digital wallet simulation system that detects suspicious transactions using a hybrid combination of **rule-based analysis** and a **machine learning model**.

The system analyzes every transaction in real time, calculates a fraud risk score, routes risky transactions through OTP verification, and provides administrators with tools to monitor transactions, fraud alerts, users, and fraud cases.

---

## 📌 Problem Statement

The rapid growth of digital payments has increased the risk of fraudulent transactions. Traditional rule-based systems can detect known patterns but may fail to identify complex or evolving fraud behavior.

FraudGuard addresses this problem by combining:

- Rule-based transaction analysis
- Machine learning fraud prediction
- Risk-based transaction decisions
- OTP step-up verification
- Fraud case management
- Administrative monitoring and reporting

---

## 🚀 Key Features

- 🔍 Hybrid fraud detection using rules and machine learning
- 🤖 Random Forest-based fraud prediction
- 📊 LOW, MEDIUM, and HIGH risk classification
- 🔐 OTP verification for risky transactions
- 🔑 JWT authentication and role-based authorization
- 👥 USER, ADMIN, and FRAUD_ANALYST roles
- 💳 Wallet balance, top-up, and transaction management
- 🏦 Virtual bank account details
- 📁 Fraud case management with SLA tracking
- 📈 User and admin dashboards
- 🚨 Fraud alert monitoring
- 🧾 Transaction complaint and dispute submission
- 🐳 Docker-based multi-service setup

---

## 🏗️ Architecture

```text
                 ┌────────────────────┐
                 │   React Frontend   │
                 │  User + Admin UI   │
                 └─────────┬──────────┘
                           │
                      REST API + JWT
                           │
                           ▼
                 ┌────────────────────┐
                 │ Spring Boot Backend│
                 │                    │
                 │ Authentication     │
                 │ Transactions       │
                 │ Fraud Rules        │
                 │ OTP Verification   │
                 │ Fraud Cases        │
                 └──────┬───────┬─────┘
                        │       │
                        │       │ REST
                        ▼       ▼
               ┌────────────┐  ┌─────────────────┐
               │ PostgreSQL │  │ Flask AI Service│
               │            │  │                 │
               │ Users      │  │ Random Forest   │
               │ Txns       │  │ Prediction API  │
               │ Cases      │  └─────────────────┘
               │ Complaints │
               └────────────┘
```

---

## 🔄 Transaction Workflow

```text
User Creates Transaction
          ↓
Spring Boot Backend
          ↓
Fraud Detection Service
        ↙     ↘
 Rule Engine   ML Model
        ↘     ↙
      Risk Score
          ↓
   Risk Classification
          ↓
 ┌────────┴─────────┐
 │                  │
LOW            MEDIUM / HIGH
 │                  │
 ▼                  ▼
Approved       OTP Verification
 │             ┌────┴────┐
 │             │         │
 │          Verified   Expired
 │             │         │
 │             ▼         ▼
 │          Approved   Blocked
 │                       +
 │                  Marked Fraud
 └──────────────┬─────────┘
                ↓
        Database Updated
                ↓
       Dashboard Monitoring
```

### Workflow Summary

1. The user submits a transaction.
2. Spring Boot performs rule-based fraud checks.
3. The backend sends transaction features to the Flask AI service.
4. The Random Forest model returns a fraud probability.
5. Rule and AI scores are combined.
6. The transaction is classified as LOW, MEDIUM, or HIGH risk.
7. LOW-risk transactions are approved directly.
8. MEDIUM/HIGH-risk transactions require OTP verification.
9. Successful OTP verification approves the transaction.
10. OTP expiry blocks the transaction and marks it as fraud.
11. Fraud-related activity is available for administrative investigation.

---

## 🧠 Fraud Detection Logic

FraudGuard uses a hybrid scoring approach.

### Rule-Based Analysis

The backend checks factors including:

- Transaction amount
- Rapid transaction frequency
- New or unusual location
- New device usage

### Machine Learning Analysis

The AI service evaluates:

```text
Amount
Location
Transaction Frequency
        ↓
Random Forest Model
        ↓
Fraud Probability
```

### Final Risk Score

```text
Final Score =
(Rule Score × 40%) +
(AI Score × 60%)
```

The backend may also apply hard risk overrides for specific high-risk conditions.

### Risk Classification

| Risk Level | Score | Action |
|---|---:|---|
| LOW | 0–39% | Auto-approved |
| MEDIUM | 40–79% | OTP verification required |
| HIGH | 80–100% | OTP verification required |

---

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- Chart.js
- react-hot-toast

### Backend

- Java 17
- Spring Boot 3
- Spring Security
- JWT
- Spring Data JPA
- Hibernate
- Spring WebSocket
- Spring Mail

### AI Service

- Python
- Flask
- scikit-learn
- Random Forest Classifier
- Pandas
- NumPy

### Database

- PostgreSQL 15

### DevOps

- Docker
- Docker Compose

---

## 📁 Project Structure

```text
AI-based-Fraud-detection-System/
│
├── src/main/java/com/example/frauddetectionsystem/
│   ├── config/          # Security, CORS and WebSocket configuration
│   ├── controller/      # REST API controllers
│   ├── service/         # Application business logic
│   ├── repository/      # Spring Data JPA repositories
│   ├── model/           # Entities and enums
│   ├── dto/             # Request and response DTOs
│   ├── security/        # JWT authentication
│   └── realtime/        # Alert broadcasting
│
├── src/main/resources/
│   ├── application.properties
│   └── schema.sql
│
├── frontend/            # React application
│
├── ai-service/
│   ├── app.py           # Flask prediction API
│   ├── generate_data.py # Synthetic dataset generation
│   └── train_model.py   # Random Forest training
│
├── docker-compose.yml
├── Dockerfile
├── pom.xml
└── README.md
```

---

## 👥 User Roles

| Role | Access |
|---|---|
| USER | Wallet, transactions, history, fraud status, complaints and profile |
| FRAUD_ANALYST | Fraud investigation and reporting |
| ADMIN | Full system monitoring, transactions, fraud cases and user management |

Public registration always creates a `USER` account.

Administrator accounts are seeded through environment configuration and cannot be created through public registration.

---

## 🔐 Security

The application implements:

- Stateless JWT authentication
- BCrypt password hashing
- Role-based access control
- Spring Security filter chain
- Method-level authorization with `@PreAuthorize`
- Protected user and administrative endpoints

---

## 🔌 Main API Endpoints

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/profile` | Get profile |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/auth/profile/phone/send-otp` | Send verification OTP |
| POST | `/api/auth/profile/phone/verify-otp` | Verify phone OTP |

### Wallet

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/wallet/topup` | Add wallet balance |
| GET | `/api/wallet/topups` | View top-up history |

### Transactions

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/transactions` | Create and analyze transaction |
| GET | `/api/transactions/my` | View transaction history |
| GET | `/api/transactions/my/{id}` | View transaction status |
| POST | `/api/transactions/my/{id}/verify-otp` | Verify transaction OTP |
| GET | `/api/transactions/fraud` | View fraud-related transactions |
| POST | `/api/transactions/{id}/report` | Submit transaction complaint |

### Administration

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/transactions` | View all transactions |
| POST | `/api/admin/transactions/{id}/approve` | Approve transaction |
| POST | `/api/admin/transactions/{id}/block` | Block transaction |
| GET | `/api/admin/fraud-alerts` | View fraud alerts |
| GET | `/api/admin/fraud-cases` | View fraud cases |
| GET | `/api/admin/users` | View users |

### Dashboard

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/dashboard/stats` | Get role-aware dashboard statistics |

### AI Service

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/predict` | Generate fraud probability |
| GET | `/health` | Check AI service status |

---

## 🤖 Machine Learning Model

The AI service uses a `RandomForestClassifier` trained on synthetic transaction data.

Main features:

```text
amount
location_code
transaction_frequency
```

Training workflow:

```text
Synthetic Data Generation
          ↓
Data Preprocessing
          ↓
Train/Test Split
          ↓
Feature Scaling
          ↓
Random Forest Training
          ↓
Model Evaluation
          ↓
Model Serialization
          ↓
Flask Prediction API
```

The current model is designed for project demonstration purposes.

---

## ⚙️ Setup and Run

### 1. Clone the Repository

```bash
git clone https://github.com/PradeepTech-hub/AI-based-Fraud-detection-System.git
cd AI-based-Fraud-detection-System
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Set the required values:

```env
DB_PASSWORD=your_database_password
JWT_SECRET=your_secure_jwt_secret

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_admin_password
```

### 3. Start the Application

```bash
docker-compose up -d --build
```

### Application URLs

| Service | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend | `http://localhost:8080` |
| AI Service | `http://localhost:5000` |
| Swagger UI | `http://localhost:8080/swagger-ui.html` |

---

## 🚧 Future Improvements

- Connect the frontend directly to the existing WebSocket alert stream
- Persist OTP challenges using Redis or database storage
- Train the model using real anonymized fraud datasets
- Add continuous model retraining and versioning
- Add explainable AI for fraud predictions
- Integrate real SMS and email providers
- Integrate a production payment gateway
- Add audit logging and model monitoring
- Deploy using cloud infrastructure and Kubernetes

---

## 👨‍💻 Author

**Pradeep M**

---

## ⭐ Note

FraudGuard is a portfolio-style full-stack project demonstrating:

- Spring Boot backend architecture
- React frontend development
- PostgreSQL integration
- Python ML service integration
- JWT authentication and role-based authorization
- Hybrid fraud risk scoring
- OTP-based step-up verification
- Fraud case management
- Docker-based deployment

The project uses synthetic ML training data and development-mode OTP behavior for local development and demonstration.
