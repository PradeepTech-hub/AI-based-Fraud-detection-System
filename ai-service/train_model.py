"""
train_model.py - Trains a Random Forest classifier on synthetic transaction data.
Run: python generate_data.py && python train_model.py
Output: fraud_model.pkl, scaler.pkl
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import joblib
import os

# ── Load data ──────────────────────────────────────────────────────────────────
if not os.path.exists("transactions.csv"):
    print("transactions.csv not found – generating data first …")
    import generate_data  # noqa: F401 (side-effect: creates the CSV)

df = pd.read_csv("transactions.csv")
print(f"Loaded {len(df)} rows. Fraud rate: {df['is_fraud'].mean()*100:.1f}%")

# ── Features / Target ─────────────────────────────────────────────────────────
FEATURES = ["amount", "location_code", "transaction_frequency"]
X = df[FEATURES].values
y = df["is_fraud"].values

# ── Train / Test split ────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ── Scale ─────────────────────────────────────────────────────────────────────
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test)

# ── Model ─────────────────────────────────────────────────────────────────────
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)
model.fit(X_train_scaled, y_train)

# ── Evaluate ──────────────────────────────────────────────────────────────────
y_pred  = model.predict(X_test_scaled)
y_proba = model.predict_proba(X_test_scaled)[:, 1]

print("\n── Classification Report ──")
print(classification_report(y_test, y_pred, target_names=["Normal", "Fraud"]))
print("── Confusion Matrix ──")
print(confusion_matrix(y_test, y_pred))
print(f"ROC-AUC: {roc_auc_score(y_test, y_proba):.4f}")

# ── Save ──────────────────────────────────────────────────────────────────────
joblib.dump(model,  "fraud_model.pkl")
joblib.dump(scaler, "scaler.pkl")
print("\nModel saved → fraud_model.pkl")
print("Scaler saved → scaler.pkl")

