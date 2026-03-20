import { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { formatCurrencyINR } from '../utils/currency';

export default function FraudStatus() {
  const [fraudTransactions, setFraudTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadFraudTransactions = async (isFirstLoad = false) => {
    if (isFirstLoad) {
      setLoading(true);
    }

    try {
      const res = await axiosInstance.get('/transactions/fraud');
      setFraudTransactions(res.data || []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error loading fraud status:', err);
      setError('Unable to refresh alerts right now. Retrying automatically.');
    } finally {
      if (isFirstLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadFraudTransactions(true);
    const id = setInterval(() => loadFraudTransactions(false), 8000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <div>⏳ Loading...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>⚠️ Fraud Alerts</h1>
      <div style={styles.metaRow}>
        <div style={styles.metaText}>
          Auto-refresh every 8s
          {lastUpdated ? ` • Last updated: ${lastUpdated.toLocaleTimeString()}` : ''}
        </div>
        <button type="button" style={styles.refreshButton} onClick={() => loadFraudTransactions(false)}>
          Refresh Now
        </button>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {fraudTransactions.length === 0 ? (
        <div style={styles.successBox}>
          ✅ No fraud detected in your account
        </div>
      ) : (
        <div>
          {fraudTransactions.map(tx => (
            <div key={tx.id} style={{
              ...styles.alertBox,
              ...(tx.fraudStatus === 'FRAUD' ? styles.alertFraud : styles.alertSuspicious)
            }}>
              <div style={styles.icon}>
                {tx.fraudStatus === 'FRAUD' ? '🚨' : '⚠️'}
              </div>
              <div style={styles.content}>
                <h4 style={styles.heading}>{tx.fraudStatus} ALERT</h4>
                <p style={styles.description}>
                  A {tx.fraudStatus.toLowerCase()} transaction was detected
                </p>
                <div style={styles.details}>
                  <div><strong>Amount:</strong> {formatCurrencyINR(tx.amount)}</div>
                  <div><strong>Location:</strong> {tx.location}</div>
                  <div><strong>Date:</strong> {new Date(tx.timestamp).toLocaleString()}</div>
                  <div><strong>Risk Score:</strong> {(tx.riskScore * 100).toFixed(2)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '800px', margin: '0 auto' },
  title: { fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  metaText: {
    color: '#666',
    fontSize: '13px',
  },
  refreshButton: {
    border: 'none',
    background: '#1f3a93',
    color: '#fff',
    borderRadius: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  },
  errorBox: {
    background: 'rgba(244,67,54,0.08)',
    borderLeft: '4px solid #F44336',
    color: '#a00000',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '12px',
    fontSize: '13px',
  },
  successBox: {
    background: 'rgba(76, 175, 80, 0.1)',
    borderLeft: '4px solid #4CAF50',
    padding: '16px',
    borderRadius: '8px',
    color: '#2e7d32',
    fontWeight: '600',
  },
  alertBox: {
    display: 'flex',
    gap: '16px',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
    borderLeft: '4px solid',
  },
  alertFraud: { background: 'rgba(244, 67, 54, 0.1)', borderLeftColor: '#F44336' },
  alertSuspicious: { background: 'rgba(255, 152, 0, 0.1)', borderLeftColor: '#FF9800' },
  icon: { fontSize: '32px', flex: '0 0 40px' },
  content: { flex: 1 },
  heading: { margin: '0 0 8px', fontSize: '16px', fontWeight: '700' },
  description: { margin: '0 0 12px', fontSize: '14px', color: '#666' },
  details: { fontSize: '13px', color: '#555', lineHeight: '1.8' },
};

