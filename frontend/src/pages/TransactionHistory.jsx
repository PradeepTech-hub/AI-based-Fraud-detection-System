import { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { formatCurrencyINR } from '../utils/currency';

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState({});
  const [otpInputs, setOtpInputs] = useState({});
  const [otpLoading, setOtpLoading] = useState({});
  const [message, setMessage] = useState(null);

  const loadTransactions = async () => {
    const res = await axiosInstance.get('/transactions/my');
    setTransactions(res.data || []);
  };

  const loadComplaints = async () => {
    const res = await axiosInstance.get('/transactions/my/complaints');
    setComplaints(res.data || []);
  };

  useEffect(() => {
    Promise.all([loadTransactions(), loadComplaints()])
      .catch(err => console.error('Fetch error:', err))
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      loadTransactions().catch(() => {
        // ignore transient polling issues
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const reportTransaction = async (transactionId) => {
    const description = window.prompt('Please describe why you believe this transaction is unauthorized:');
    if (!description || !description.trim()) return;

    setReportLoading((prev) => ({ ...prev, [transactionId]: true }));
    try {
      await axiosInstance.post(`/transactions/${transactionId}/report`, {
        transactionId,
        description,
      });
      setMessage('Complaint submitted. Our team will review your report shortly.');
      await loadComplaints();
    } catch (err) {
      console.error('Report failed', err);
      window.alert(err.response?.data?.message || 'Unable to submit report at this time.');
    } finally {
      setReportLoading((prev) => ({ ...prev, [transactionId]: false }));
    }
  };

  const verifyOtpForTransaction = async (transactionId) => {
    const otp = String(otpInputs[transactionId] || '').trim();
    if (!/^\d{6}$/.test(otp)) {
      window.alert('Enter a valid 6-digit OTP.');
      return;
    }

    setOtpLoading((prev) => ({ ...prev, [transactionId]: true }));
    try {
      await axiosInstance.post(`/transactions/my/${transactionId}/verify-otp`, { otp });
      setMessage(`OTP verified for transaction #${transactionId}. Payment processing has started.`);
      setOtpInputs((prev) => ({ ...prev, [transactionId]: '' }));
      await loadTransactions();
    } catch (err) {
      window.alert(err.response?.data?.message || 'OTP verification failed.');
    } finally {
      setOtpLoading((prev) => ({ ...prev, [transactionId]: false }));
    }
  };

  if (loading) return <div>⏳ Loading...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📋 My Transaction History</h1>
      <div style={styles.toolbar}>
        <button type="button" style={styles.refreshButton} onClick={() => loadTransactions()}>
          Refresh Status
        </button>
      </div>
      {message && <div style={styles.successBox}>{message}</div>}

      {transactions.length === 0 ? (
        <div style={styles.empty}>No transactions yet</div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Amount</th>
                <th>Location</th>
                <th>Date</th>
                <th>Fraud</th>
                <th>Decision</th>
                <th>Payment</th>
                <th>Risk</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id}>
                  <td>{tx.id}</td>
                  <td>{formatCurrencyINR(tx.amount)}</td>
                  <td>{tx.location}</td>
                  <td>{new Date(tx.timestamp).toLocaleString()}</td>
                  <td>
                    <span style={{
                      ...styles.badge,
                      ...(tx.fraudStatus === 'FRAUD' ? styles.badgeFraud : tx.fraudStatus === 'SUSPICIOUS' ? styles.badgeSuspicious : styles.badgeNormal)
                    }}>
                      {tx.fraudStatus}
                    </span>
                  </td>
                  <td>{tx.transactionStatus || '-'}</td>
                  <td>
                    {tx.paymentStatus || '-'}
                    {String(tx.paymentStatus || '').toUpperCase() === 'OTP_REQUIRED' && (
                      <div style={styles.otpWrap}>
                        <input
                          type="text"
                          maxLength={6}
                          value={otpInputs[tx.id] || ''}
                          onChange={(e) => setOtpInputs((prev) => ({ ...prev, [tx.id]: e.target.value }))}
                          placeholder="Enter OTP"
                          style={styles.otpInput}
                        />
                        <button
                          type="button"
                          style={styles.verifyOtpButton}
                          onClick={() => verifyOtpForTransaction(tx.id)}
                          disabled={Boolean(otpLoading[tx.id])}
                        >
                          {otpLoading[tx.id] ? 'Verifying...' : 'Verify'}
                        </button>
                      </div>
                    )}
                  </td>
                  <td>{(tx.riskScore * 100).toFixed(1)}%</td>
                  <td>
                    <button
                      type="button"
                      style={styles.reportButton}
                      onClick={() => reportTransaction(tx.id)}
                      disabled={Boolean(reportLoading[tx.id])}
                    >
                      {reportLoading[tx.id] ? 'Submitting...' : 'Report Not Mine'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={styles.complaintsBox}>
        <h2 style={styles.complaintsTitle}>My Submitted Complaints</h2>
        {complaints.length === 0 ? (
          <div style={styles.emptySmall}>No complaints submitted yet.</div>
        ) : (
          <div style={styles.complaintList}>
            {complaints.map((c) => (
              <div key={c.id} style={styles.complaintItem}>
                <div><strong>Transaction:</strong> {c.transactionId}</div>
                <div><strong>Status:</strong> {c.status}</div>
                <div><strong>Reason:</strong> {c.description}</div>
                <div><strong>Raised:</strong> {new Date(c.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1000px', margin: '0 auto' },
  title: { fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' },
  toolbar: {
    marginBottom: '10px',
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
  successBox: {
    background: 'rgba(46,125,50,0.1)',
    borderLeft: '4px solid #2E7D32',
    color: '#1b5e20',
    padding: '10px 12px',
    borderRadius: '8px',
    marginBottom: '12px',
    fontSize: '13px',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
    fontSize: '16px',
  },
  tableWrapper: {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#fff',
  },
  badgeFraud: { background: '#F44336' },
  badgeSuspicious: { background: '#FF9800' },
  badgeNormal: { background: '#4CAF50' },
  reportButton: {
    border: 'none',
    borderRadius: '6px',
    padding: '6px 10px',
    background: '#c62828',
    color: '#fff',
    fontWeight: '700',
    fontSize: '11px',
    cursor: 'pointer',
  },
  otpWrap: {
    marginTop: '6px',
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  otpInput: {
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '5px 8px',
    fontSize: '11px',
    width: '92px',
  },
  verifyOtpButton: {
    border: 'none',
    borderRadius: '6px',
    padding: '5px 8px',
    background: '#0b8457',
    color: '#fff',
    fontWeight: 700,
    fontSize: '10px',
    cursor: 'pointer',
  },
  complaintsBox: {
    marginTop: '18px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    padding: '14px',
  },
  complaintsTitle: {
    margin: '0 0 10px',
    fontSize: '16px',
    color: '#1a1a2e',
  },
  emptySmall: {
    fontSize: '13px',
    color: '#666',
  },
  complaintList: {
    display: 'grid',
    gap: '10px',
  },
  complaintItem: {
    border: '1px solid #eee',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '13px',
    lineHeight: 1.6,
  },
};

