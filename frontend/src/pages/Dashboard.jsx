import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import axiosInstance from '../api/axiosInstance';
import { formatCurrencyINR } from '../utils/currency';
import { getOutcomeLabel } from '../utils/transactionDisplay';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [userRole, setUserRole] = useState('USER');
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    const [statsRes, profileRes] = await Promise.all([
      axiosInstance.get('/dashboard/stats'),
      axiosInstance.get('/auth/profile'),
    ]);

    setStats(statsRes.data);
    setProfile(profileRes.data);
    setUserBalance(profileRes.data.balance || 0);
    setUserRole(profileRes.data.role || 'USER');
  };

  useEffect(() => {
    loadDashboardData()
      .catch(err => console.error('Dashboard error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.feedback}>Loading dashboard...</div>;
  if (!stats) return <div style={styles.feedback}>Failed to load dashboard.</div>;

  const doughnutData = {
    labels: ['Normal', 'Suspicious', 'Fraud'],
    datasets: [{
      data: [stats.normalCount, stats.suspiciousCount, stats.fraudCount],
      backgroundColor: ['#4CAF50', '#FF9800', '#F44336'],
      borderColor: ['#fff', '#fff', '#fff'],
      borderWidth: 2,
    }],
  };

  const lineData = {
    labels: stats.recentTransactions.slice(0, 10).reverse().map((_, i) => `Tx ${i + 1}`),
    datasets: [{
      label: 'Risk Score',
      data: stats.recentTransactions.slice(0, 10).reverse().map(t => (t.riskScore * 100).toFixed(1)),
      borderColor: '#e94560',
      backgroundColor: 'rgba(233, 69, 96, 0.1)',
      tension: 0.4,
      fill: true,
    }],
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>User Dashboard</h1>
        <p style={styles.subtitle}>Track your transactions, fraud alerts, and risk trends in real time.</p>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>{userRole === 'USER' ? 'Account Balance' : 'Overall Bank Balance'}</div>
          <div style={styles.balanceValue}>{formatCurrencyINR(userRole === 'USER' ? userBalance : (stats.totalBankBalance || 0))}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Transactions</div>
          <div style={styles.statValue}>{stats.totalTransactions}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Fraud Cases</div>
          <div style={styles.statValue}>{stats.fraudCount}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Suspicious</div>
          <div style={styles.statValue}>{stats.suspiciousCount}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Fraud Rate</div>
          <div style={styles.statValue}>{stats.fraudRate}%</div>
        </div>
      </div>

      {userRole === 'USER' && !profile?.phoneVerified && (
        <div style={styles.phoneWarningBanner}>
          <span>📵 Your phone isn't verified yet. Suspicious/large payments need OTP verification to go through.</span>
          <Link to="/profile" style={styles.phoneWarningLink}>Verify Now</Link>
        </div>
      )}
      {userRole === 'USER' && profile?.phoneVerified && (
        <div style={styles.phoneVerifiedBadgeRow}>
          <span style={styles.phoneVerifiedBadge}>✓ Phone Verified</span>
        </div>
      )}

      <div style={styles.chartsGrid}>
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>Transaction Status Distribution</h3>
          <div style={styles.chartArea}>
            <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>Risk Score Trend (Recent)</h3>
          <div style={styles.chartArea}>
            <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100 } } }} />
          </div>
        </div>
      </div>

      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>Recent Transactions</h3>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Amount</th>
                <th>Location</th>
                <th>Status</th>
                <th>Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentTransactions.slice(0, 6).map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.id}</td>
                  <td>{formatCurrencyINR(tx.amount)}</td>
                  <td>{tx.location}</td>
                  <td>
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
                    {getOutcomeLabel(tx) && (
                      <span style={styles.outcomeNote}>{getOutcomeLabel(tx)}</span>
                    )}
                  </td>
                  <td>{(tx.riskScore * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
  },
  statCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.04)',
  },
  statLabel: { color: '#64748b', fontSize: '13px', marginBottom: '10px' },
  statValue: { fontSize: '30px', fontWeight: 700, color: '#0f172a' },
  balanceValue: { fontSize: '28px', fontWeight: 700, color: '#667eea' },
  phoneWarningBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    background: '#fff4e5',
    border: '1px solid #ffb74d',
    borderRadius: '10px',
    padding: '12px 16px',
    color: '#5d4037',
    fontSize: '13px',
    fontWeight: 600,
  },
  phoneWarningLink: {
    background: '#1f3a93',
    color: '#fff',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: 700,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  phoneVerifiedBadgeRow: { display: 'flex' },
  phoneVerifiedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(22, 163, 74, 0.12)',
    color: '#14532d',
    borderRadius: '999px',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: 700,
  },
  outcomeNote: {
    display: 'block',
    marginTop: '4px',
    fontSize: '11px',
    color: '#0b8457',
    fontWeight: 600,
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '14px',
  },
  panel: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
  },
  panelTitle: { marginBottom: '14px', fontSize: '18px', color: '#111827' },
  chartArea: {
    height: '300px',
    position: 'relative',
  },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  badge: {
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 700,
  },
  badgeFraud: { background: '#F44336', color: '#fff' },
  badgeSuspicious: { background: '#FF9800', color: '#fff' },
  badgeNormal: { background: '#4CAF50', color: '#fff' },
};

