import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { formatCurrencyINR } from '../utils/currency';

export default function AdminFraudAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [fraudCases, setFraudCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const loadData = async (isFirstLoad = false) => {
    if (isFirstLoad) {
      setLoading(true);
    }

    try {
      const [alertsRes, casesRes] = await Promise.all([
        axiosInstance.get('/admin/fraud-alerts'),
        axiosInstance.get('/admin/fraud-cases'),
      ]);
      setAlerts(alertsRes.data || []);
      setFraudCases(casesRes.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading fraud alerts/cases:', err);
      toast.error('Failed to refresh fraud alerts.');
    } finally {
      if (isFirstLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData(true);
    const id = setInterval(() => loadData(false), 8000);
    return () => clearInterval(id);
  }, []);

  const caseByTransaction = fraudCases.reduce((acc, c) => {
    acc[c.transactionId] = c;
    return acc;
  }, {});

  const handleCaseAction = (caseId, action) => {
    if (action === 'resolve' || action === 'false-positive') {
      // Show a toast with input field
      toast.custom(
        (t) => (
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            minWidth: '300px',
          }}>
            <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
              {action === 'resolve' ? 'Add resolution notes (optional):' : 'Add false-positive notes (optional):'}
            </div>
            <input
              id={`notes-input-${caseId}`}
              type="text"
              placeholder="Enter notes..."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d0d7de',
                borderRadius: '6px',
                fontSize: '13px',
                marginBottom: '12px',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => toast.dismiss(t.id)}
                style={{
                  background: '#e0e7ff',
                  color: '#4f46e5',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const notes = document.getElementById(`notes-input-${caseId}`)?.value || '';
                  toast.dismiss(t.id);
                  const key = `${caseId}-${action}`;
                  setActionLoading((prev) => ({ ...prev, [key]: true }));
                  try {
                    await axiosInstance.post(`/admin/fraud-cases/${caseId}/${action}`, {
                      analystNotes: notes,
                    });
                    await loadData(false);
                    toast.success(`Case ${action === 'resolve' ? 'resolved' : 'marked as false positive'} successfully!`);
                  } catch (err) {
                    console.error(`Failed to ${action} fraud case:`, err);
                    toast.error(err.response?.data?.message || 'Unable to update fraud case right now.');
                  } finally {
                    setActionLoading((prev) => ({ ...prev, [key]: false }));
                  }
                }}
                style={{
                  background: '#4f46e5',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                Submit
              </button>
            </div>
          </div>
        ),
        { duration: Infinity },
      );
    }
  };

  if (loading) return <div>⏳ Loading...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🚨 Fraud Alerts</h1>
      <div style={styles.metaRow}>
        <div style={styles.metaText}>
          Auto-refresh every 8s
          {lastUpdated ? ` • Last updated: ${lastUpdated.toLocaleTimeString()}` : ''}
        </div>
        <button type="button" style={styles.refreshButton} onClick={() => loadData(false)}>
          Refresh Now
        </button>
      </div>

      {alerts.length === 0 ? (
        <div style={styles.empty}>No fraud alerts</div>
      ) : (
        <div>
          {alerts.map(alert => (
            (() => {
              const relatedCase = caseByTransaction[alert.id];
              const isCaseOpen = relatedCase && relatedCase.status === 'OPEN';

              return (
            <div key={alert.id} style={{
              ...styles.alertCard,
              ...(alert.fraudStatus === 'FRAUD' ? styles.fraudCard : styles.suspiciousCard)
            }}>
              <div style={styles.icon}>
                {alert.fraudStatus === 'FRAUD' ? '🚨' : '⚠️'}
              </div>
              <div style={styles.content}>
                <h4>{alert.fraudStatus}</h4>
                <p>{formatCurrencyINR(alert.amount)} | {alert.location} | {new Date(alert.timestamp).toLocaleString()}</p>
                <div>Risk: {(alert.riskScore * 100).toFixed(2)}%</div>
                {relatedCase ? (
                  <div style={styles.caseSection}>
                    <div style={styles.caseHeader}>
                      <span style={styles.caseLabel}>Case #{relatedCase.id}</span>
                      <span style={{
                        ...styles.caseStatus,
                        ...(relatedCase.status === 'OPEN'
                          ? styles.caseStatusOpen
                          : relatedCase.status === 'RESOLVED'
                            ? styles.caseStatusResolved
                            : styles.caseStatusFalsePositive)
                      }}>
                        {relatedCase.status}
                      </span>
                    </div>

                    {relatedCase.analystNotes && (
                      <div style={styles.caseNotes}>Notes: {relatedCase.analystNotes}</div>
                    )}

                    {isCaseOpen && (
                      <div style={styles.actionsRow}>
                        <button
                          type="button"
                          style={{ ...styles.actionBtn, ...styles.resolveBtn }}
                          onClick={() => handleCaseAction(relatedCase.id, 'resolve')}
                          disabled={Boolean(actionLoading[`${relatedCase.id}-resolve`])}
                        >
                          {actionLoading[`${relatedCase.id}-resolve`] ? 'Resolving...' : 'Resolve Case'}
                        </button>
                        <button
                          type="button"
                          style={{ ...styles.actionBtn, ...styles.falsePositiveBtn }}
                          onClick={() => handleCaseAction(relatedCase.id, 'false-positive')}
                          disabled={Boolean(actionLoading[`${relatedCase.id}-false-positive`])}
                        >
                          {actionLoading[`${relatedCase.id}-false-positive`] ? 'Updating...' : 'Mark False Positive'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
              );
            })()
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '900px', margin: '0 auto' },
  title: { fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '14px',
    flexWrap: 'wrap',
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
  empty: { textAlign: 'center', padding: '40px', color: '#999' },
  alertCard: {
    display: 'flex',
    gap: '16px',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '12px',
    borderLeft: '4px solid',
  },
  fraudCard: { background: 'rgba(244,67,54,0.1)', borderLeftColor: '#F44336' },
  suspiciousCard: { background: 'rgba(255,152,0,0.1)', borderLeftColor: '#FF9800' },
  icon: { fontSize: '28px' },
  content: { flex: 1 },
  caseSection: {
    marginTop: '10px',
    background: 'rgba(255,255,255,0.65)',
    borderRadius: '8px',
    padding: '10px',
    border: '1px solid rgba(0,0,0,0.08)',
  },
  caseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  caseLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#333',
  },
  caseStatus: {
    borderRadius: '999px',
    padding: '3px 10px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#fff',
  },
  caseStatusOpen: { background: '#FF9800' },
  caseStatusResolved: { background: '#2E7D32' },
  caseStatusFalsePositive: { background: '#546E7A' },
  caseNotes: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#333',
  },
  actionsRow: {
    marginTop: '10px',
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  actionBtn: {
    border: 'none',
    borderRadius: '8px',
    padding: '7px 10px',
    cursor: 'pointer',
    color: '#fff',
    fontWeight: '700',
    fontSize: '12px',
  },
  resolveBtn: { background: '#2E7D32' },
  falsePositiveBtn: { background: '#546E7A' },
};

