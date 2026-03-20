"""
generate_data.py - Generates synthetic transaction data for training the fraud detection model.
Run: python generate_data.py
Output: transactions.csv
"""
import numpy as np
import pandas as pd

np.random.seed(42)
N = 5000

# Normal transactions
normal_amount     = np.random.exponential(scale=500, size=int(N * 0.85))
normal_location   = np.random.choice([0, 1, 2, 3], size=int(N * 0.85))   # encoded location
normal_frequency  = np.random.randint(1, 5, size=int(N * 0.85))
normal_labels     = np.zeros(int(N * 0.85))

# Fraudulent transactions
fraud_amount      = np.random.uniform(8000, 50000, size=int(N * 0.15))
fraud_location    = np.random.choice([4, 5, 6, 7], size=int(N * 0.15))   # unusual locations
fraud_frequency   = np.random.randint(5, 20, size=int(N * 0.15))
fraud_labels      = np.ones(int(N * 0.15))

amounts    = np.concatenate([normal_amount, fraud_amount])
locations  = np.concatenate([normal_location, fraud_location])
freqs      = np.concatenate([normal_frequency, fraud_frequency])
labels     = np.concatenate([normal_labels, fraud_labels])

df = pd.DataFrame({
    "amount": amounts,
    "location_code": locations,
    "transaction_frequency": freqs,
    "is_fraud": labels.astype(int)
})

df = df.sample(frac=1, random_state=42).reset_index(drop=True)
df.to_csv("transactions.csv", index=False)
print(f"Dataset generated: {len(df)} rows  |  Fraud: {df['is_fraud'].sum()} ({df['is_fraud'].mean()*100:.1f}%)")

