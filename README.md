# 🛡️ AI-Based Fraud Detection System

## 📌 Problem Statement

With the rapid growth of digital transactions, fraud has become a major challenge for financial systems. Traditional rule-based systems are often insufficient to detect sophisticated fraud patterns in real time.

This project aims to build a **real-time AI-powered fraud detection system** that:

* Identifies suspicious transactions using machine learning
* Assigns dynamic risk levels
* Enables analysts to investigate fraud cases efficiently
* Provides real-time alerts and monitoring

---

## 🚀 Key Features

* 🔍 Real-time fraud detection using ML model (Random Forest)
* 📊 Risk scoring system (LOW, MEDIUM, HIGH, CRITICAL)
* 🔐 JWT-based authentication & role-based access control
* 💳 Digital wallet with transaction monitoring
* ⚡ WebSocket-based real-time fraud alerts
* 📁 Fraud case management with SLA tracking
* 📈 Admin dashboard with analytics & reports

---

## 🏗️ Architecture

```
Frontend (React)  →  Backend (Spring Boot)  →  PostgreSQL
                           ↓
                     Python ML Service
```

### Flow:

1. User performs transaction
2. Backend sends data to ML service
3. ML returns fraud probability
4. Backend assigns risk level & triggers alerts
5. Results stored and displayed on dashboard

---

## 🛠️ Tech Stack

### Backend

* Java 17, Spring Boot
* Spring Security + JWT
* JPA / Hibernate
* WebSocket

### Frontend

* React (Vite)
* Axios
* Chart.js

### AI Service

* Python (Flask)
* Scikit-learn (Random Forest)
* Pandas, NumPy

### Database

* PostgreSQL

### DevOps

* Docker & Docker Compose

---

## ⚙️ Setup & Run

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/fraud-detection-system.git
cd fraud-detection-system
```

### 2. Start using Docker (Recommended)

```bash
docker-compose up -d
```

### Access:

* Frontend → http://localhost:5173
* Backend → http://localhost:8080
* AI Service → http://localhost:5000

---

## 🔐 Authentication & Roles

### Default Admin Account (Seeded on Startup)

For safety, the backend will **only seed an ADMIN user if you provide environment variables**:

* `ADMIN_EMAIL`
* `ADMIN_PASSWORD`

(Otherwise no default admin password is committed to the repo.)

### Analyst Account

* ❌ No default analyst account is created automatically
* ✅ Must be created manually

### How to Create Analyst

**Option 1: Register via UI**

1. Go to `/register`
2. Create account
3. Update role in database to `FRAUD_ANALYST`

**Option 2: Backend Setup (Recommended)**

* Add analyst user in `DataInitializer.java`

**Option 3: Direct Database Insert**

---

## 🌐 Login System

* ✅ Single login portal for all roles
* URL: `http://localhost:5173/login`

After login:

* Users are redirected to `/dashboard`
* UI features change based on role:

  * ADMIN → Full system access
  * FRAUD_ANALYST → Fraud case investigation & reports
  * USER → Transactions & wallet

---

## 🔌 API Endpoints (Sample)

### Auth

* POST `/api/auth/register`
* POST `/api/auth/login`

### Transactions

* POST `/api/transactions/create`
* GET `/api/transactions/history`

### AI Prediction

* POST `/predict`

---

## 📊 Fraud Detection Logic

System evaluates:

* Transaction amount
* Location pattern
* Transaction frequency
* ML prediction score

### Risk Levels:

| Level    | Range   |
| -------- | ------- |
| LOW      | 0–25%   |
| MEDIUM   | 25–50%  |
| HIGH     | 50–75%  |
| CRITICAL | 75–100% |

---

## 👨‍💻 User Roles

* **ADMIN** → Full system access
* **FRAUD_ANALYST** → Investigate fraud cases, monitor alerts
* **USER** → Perform transactions, view history

---

## 📁 Project Structure

```
backend/
frontend/
ai-service/
docker-compose.yml
```

---

## 🔒 Security

* JWT Authentication
* Password hashing (BCrypt)
* Role-based authorization
* Secure API endpoints

---

## 🚧 Future Improvements

* Deep Learning models
* Payment gateway integration
* Mobile app (React Native)
* Real-time streaming (Kafka)
* Advanced analytics

---

## 👤 Author

**Pradeep M**

---

## ⭐ Note

This project is built as a **production-style full-stack system** demonstrating:

* Backend architecture (Spring Boot)
* Frontend development (React)
* ML integration (Python)
* Real-time systems (WebSockets)
