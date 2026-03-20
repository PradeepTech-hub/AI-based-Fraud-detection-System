"""
app.py - Flask REST API that exposes the trained fraud-detection model.
Run: python app.py
Endpoint: POST /predict  { "amount": 5000, "location": "New York", "transaction_frequency": 3 }
Response: { "fraudScore": 0.12, "isFraud": false }
"""
import os
import joblib
import numpy as np
from flask import Flask, request, jsonify

app = Flask(__name__)

# ── Load model artifacts ───────────────────────────────────────────────────────
MODEL_PATH  = os.path.join(os.path.dirname(__file__), "fraud_model.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "scaler.pkl")

if not os.path.exists(MODEL_PATH):
    print("Model not found – training now …")
    import train_model  # noqa: F401 (side-effect: creates the .pkl files)

model  = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
print("✅ Model and scaler loaded successfully.")

# Known locations → encoded as numeric risk index
LOCATION_RISK: dict[str, int] = {
    "new york": 0, "los angeles": 1, "chicago": 2, "houston": 3,
    "london": 1, "paris": 2, "mumbai": 3,
}

def encode_location(location: str) -> int:
    """Return a numeric encoding for a location string."""
    return LOCATION_RISK.get(str(location).strip().lower(), 5)   # 5 = unknown / high-risk


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(force=True)

    try:
        amount     = float(data.get("amount", 0))
        location   = data.get("location", "unknown")
        frequency  = int(data.get("transaction_frequency", 1))
    except (TypeError, ValueError) as exc:
        return jsonify({"error": f"Invalid input: {exc}"}), 400

    location_code = encode_location(location)
    features = np.array([[amount, location_code, frequency]])
    features_scaled = scaler.transform(features)

    fraud_proba = float(model.predict_proba(features_scaled)[0][1])
    is_fraud    = bool(fraud_proba >= 0.5)

    return jsonify({
        "fraudScore": round(fraud_proba, 4),
        "isFraud":    is_fraud
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "RandomForestClassifier"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)

