import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';

export default function AdminReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('');
  const [availableLocations, setAvailableLocations] = useState([]);
  const [locationRows, setLocationRows] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      axiosInstance.get('/admin/reports'),
      axiosInstance.get('/admin/reports/locations'),
    ])
      .then(([reportResult, locationsResult]) => {
        if (reportResult.status === 'fulfilled') {
          setReport(reportResult.value.data);
        }

        if (locationsResult.status === 'fulfilled') {
          setAvailableLocations(locationsResult.value.data || []);
        }
      })
      .catch((err) => console.error('Error loading reports:', err))
      .finally(() => setLoading(false));
  }, []);

  const previewByLocation = async () => {
    if (!location.trim()) {
      toast.error('Please select a location first.');
      return;
    }

    setReportLoading(true);
    try {
      const res = await axiosInstance.get('/admin/reports/location', {
        params: { location: location.trim() },
      });
      setLocationRows(res.data || []);
      toast.success(`Found ${res.data?.length || 0} transactions for "${location.trim()}"`);
    } catch (err) {
      console.error('Failed to fetch location report:', err);
      toast.error(err.response?.data?.message || 'Unable to fetch location report.');
    } finally {
      setReportLoading(false);
    }
  };

  const downloadByLocation = async () => {
    if (!location.trim()) {
      toast.error('Please select a location first.');
      return;
    }

    try {
      const response = await axiosInstance.get('/admin/reports/location/download', {
        params: { location: location.trim() },
        responseType: 'blob',
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `location-report-${location.trim().replace(/\s+/g, '-').toLowerCase()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Report downloaded successfully!');
    } catch (err) {
      console.error('Failed to download location report:', err);
      toast.error(err.response?.data?.message || 'Unable to download location report.');
    }
  };

  if (loading) return <div>⏳ Loading...</div>;

  const locationOptions = Array.from(
    new Set([
      ...availableLocations,
      ...(report?.fraudByLocation || [])
        .map((row) => (row?.location || row?.city || row?.name || '').trim())
        .filter(Boolean),
    ])
  ).sort((a, b) => a.localeCompare(b));

  const totalTransactions = report?.totalTransactions ?? 0;
  const fraudCount = report?.fraudCount ?? report?.fraudTransactions ?? 0;
  const suspiciousCount = report?.suspiciousCount ?? report?.suspiciousTransactions ?? 0;
  const normalCount = report?.normalCount ?? Math.max(0, totalTransactions - fraudCount - suspiciousCount);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📊 System Reports</h1>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.label}>Total Transactions</div>
          <div style={styles.value}>{totalTransactions}</div>
        </div>
        <div style={styles.card}>
          <div style={styles.label}>Fraud Cases</div>
          <div style={styles.value}>{fraudCount}</div>
        </div>
        <div style={styles.card}>
          <div style={styles.label}>Suspicious</div>
          <div style={styles.value}>{suspiciousCount}</div>
        </div>
        <div style={styles.card}>
          <div style={styles.label}>Normal</div>
          <div style={styles.value}>{normalCount}</div>
        </div>
        <div style={styles.card}>
          <div style={styles.label}>Fraud Rate</div>
          <div style={styles.value}>{report?.fraudRate}%</div>
        </div>
        <div style={styles.card}>
          <div style={styles.label}>Total Users</div>
          <div style={styles.value}>{report?.totalUsers}</div>
        </div>
        <div style={styles.card}>
          <div style={styles.label}>Total Bank Balance</div>
          <div style={styles.value}>₹{Number(report?.totalBankBalance || 0).toFixed(2)}</div>
        </div>
      </div>

      <div style={styles.locationBox}>
        <h2 style={styles.sectionTitle}>Location Based Report</h2>
        <div style={styles.locationActions}>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={styles.locationInput}
          >
            <option value="">Select location</option>
            {locationOptions.length === 0 && <option value="" disabled>No locations available</option>}
            {locationOptions.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
          <button type="button" style={styles.previewButton} onClick={previewByLocation} disabled={reportLoading || !location}>
            {reportLoading ? 'Loading...' : 'Preview'}
          </button>
          <button type="button" style={styles.downloadButton} onClick={downloadByLocation} disabled={!location}>
            Download CSV
          </button>
        </div>

        {locationRows.length > 0 && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>User ID</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Fraud</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {locationRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.userId}</td>
                    <td>{row.userName || '-'}</td>
                    <td>₹{Number(row.amount || 0).toFixed(2)}</td>
                    <td>{row.fraudStatus}</td>
                    <td>{row.paymentStatus || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1000px', margin: '0 auto' },
  title: { fontSize: '24px', fontWeight: 'bold', marginBottom: '32px' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  card: {
    background: '#fff',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  label: { color: '#666', fontSize: '13px', marginBottom: '12px' },
  value: { fontSize: '32px', fontWeight: 'bold', color: '#e94560' },
  locationBox: {
    marginTop: '20px',
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    padding: '16px',
  },
  sectionTitle: {
    margin: '0 0 12px',
    fontSize: '18px',
    color: '#1a1a2e',
  },
  locationActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  locationInput: {
    minWidth: '280px',
    padding: '8px 10px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '13px',
    background: '#fff',
  },
  previewButton: {
    border: 'none',
    background: '#1f3a93',
    color: '#fff',
    borderRadius: '8px',
    padding: '8px 12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  downloadButton: {
    border: 'none',
    background: '#2e7d32',
    color: '#fff',
    borderRadius: '8px',
    padding: '8px 12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
};

