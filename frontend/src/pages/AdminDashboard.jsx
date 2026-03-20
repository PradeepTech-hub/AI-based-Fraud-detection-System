import { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import axiosInstance from '../api/axiosInstance';
import { formatCurrencyINR } from '../utils/currency';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadStats = async (isFirstLoad = false) => {
    if (isFirstLoad) {
      setLoading(true);
    }

    try {
      const res = await axiosInstance.get('/dashboard/stats');
      setStats(res.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError('Unable to refresh dashboard metrics right now. Retrying automatically.');
    } finally {
      if (isFirstLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadStats(true);
    const id = setInterval(() => loadStats(false), 8000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <div style={styles.feedback}>Loading admin dashboard...</div>;
  if (!stats) return <div style={styles.feedback}>Failed to load admin dashboard.</div>;

  const chartData = {
    labels: ['Normal', 'Suspicious', 'Fraud'],
    datasets: [{
      data: [stats.normalCount, stats.suspiciousCount, stats.fraudCount],
      backgroundColor: ['#4CAF50', '#FF9800', '#F44336'],
      borderColor: ['#fff', '#fff', '#fff'],
      borderWidth: 2,
    }],
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <p style={styles.subtitle}>Monitor system-wide fraud activity, user growth, and operational risk.</p>
        <div style={styles.metaRow}>
          <span style={styles.metaText}>
            Auto-refresh every 8s
            {lastUpdated ? ` • Last updated: ${lastUpdated.toLocaleTimeString()}` : ''}
          </span>
          <button type="button" style={styles.refreshButton} onClick={() => loadStats(false)}>
            Refresh Now
          </button>
        </div>
        {error && <div style={styles.errorBox}>{error}</div>}
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.label}>Total Transactions</div>
          <div style={styles.value}>{stats.totalTransactions}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.label}>Fraud Count</div>
          <div style={styles.value}>{stats.fraudCount}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.label}>Suspicious</div>
          <div style={styles.value}>{stats.suspiciousCount}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.label}>Total Users</div>
          <div style={styles.value}>{stats.totalUsers}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.label}>Overall Bank Balance</div>
          <div style={styles.value}>{formatCurrencyINR(stats.totalBankBalance || 0)}</div>
        </div>
      </div>

      <div style={styles.panelsGrid}>
        <div style={styles.chartContainer}>
          <h3 style={styles.panelTitle}>Transaction Status Overview</h3>
          <div style={styles.chartArea}>
            <Doughnut data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div style={styles.recentPanel}>
          <h3 style={styles.panelTitle}>Recent High Risk Transactions</h3>
          {stats.recentTransactions.length === 0 ? (
            <p style={styles.empty}>No transactions available.</p>
          ) : (
            <div style={styles.alertList}>
              {stats.recentTransactions.slice(0, 6).map((tx) => (
                <div key={tx.id} style={styles.alertItem}>
                  <div style={styles.alertContent}>
                    <div style={styles.amount}>{formatCurrencyINR(tx.amount)}</div>
                    <div style={styles.meta}>{tx.location} • #{tx.id}</div>
                  </div>
                  <span
                    style={{
                      ...styles.badge,
                      ...(tx.fraudStatus === 'FRAUD'
                        ? styles.badgeFraud
                        : tx.fraudStatus === 'SUSPICIOUS'
                          ? styles.badgeSuspicious
                          : styles.badgeNormal),
                    }}
                  >
                    {tx.fraudStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  feedback: {
    maxWidth: '1180px',
    margin: '0 auto',
    color: '#1f2937',
    padding: '18px',
    background: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e5e7eb',
  },
  container: { maxWidth: '1180px', margin: '0 auto', display: 'grid', gap: '20px' },
  header: {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    padding: '22px 24px',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
  },
  title: { fontSize: '30px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' },
  subtitle: { fontSize: '14px', color: '#6b7280' },
  metaRow: {
    marginTop: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  metaText: {
    color: '#6b7280',
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
    marginTop: '10px',
    background: 'rgba(244,67,54,0.08)',
    borderLeft: '4px solid #F44336',
    color: '#a00000',
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '13px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
  },
  statCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    padding: '20px',
    borderRadius: '14px',
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.04)',
  },
  label: { color: '#64748b', fontSize: '13px', marginBottom: '10px' },
  value: { fontSize: '30px', fontWeight: 700, color: '#0f172a' },
  panelsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '14px',
    alignItems: 'start',
  },
  chartContainer: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    padding: '20px',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
    minHeight: '360px',
    display: 'flex',
    flexDirection: 'column',
  },
  chartArea: {
    height: '300px',
    position: 'relative',
  },
  recentPanel: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    padding: '20px',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '360px',
  },
  panelTitle: { marginBottom: '14px', fontSize: '18px', color: '#111827' },
  empty: { color: '#6b7280', fontSize: '14px' },
  alertList: {
    display: 'grid',
    gap: '10px',
    maxHeight: '300px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  alertItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '10px',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '12px',
  },
  alertContent: {
    minWidth: 0,
    flex: '1 1 220px',
  },
  amount: { fontWeight: 700, color: '#0f172a' },
  meta: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
    wordBreak: 'break-word',
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    flex: '0 0 auto',
  },
  badgeFraud: { background: '#F44336', color: '#fff' },
  badgeSuspicious: { background: '#FF9800', color: '#fff' },
  badgeNormal: { background: '#4CAF50', color: '#fff' },
};

