import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { formatCurrencyINR } from '../utils/currency';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadTransactions = async (isFirstLoad = false) => {
    if (isFirstLoad) {
      setLoading(true);
    }

    try {
      const res = await axiosInstance.get('/admin/transactions');
      setTransactions(res.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading transactions:', err);
      toast.error('Unable to refresh transactions right now.');
    } finally {
      if (isFirstLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadTransactions(true);
    const id = setInterval(() => loadTransactions(false), 8000);
    return () => clearInterval(id);
  }, []);

  const updateTransactionDecision = async (id, action) => {
    const key = `${id}-${action}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await axiosInstance.post(`/admin/transactions/${id}/${action}`);
      await loadTransactions(false);
      toast.success(res.data?.message || `Transaction ${action === 'approve' ? 'approved' : 'blocked'} successfully.`);
    } catch (err) {
      console.error(`Failed to ${action} transaction`, err);
      toast.error(err.response?.data?.message || 'Unable to update transaction right now.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const deleteTransaction = (id) => {
    toast((t) => (
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '16px 20px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
      }}>
        <span style={{ flex: 1, fontSize: '14px', color: '#333' }}>Delete transaction #{id}? Cannot undo.</span>
        <div style={{ display: 'flex', gap: '6px' }}>
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
              toast.dismiss(t.id);
              const key = `${id}-delete`;
              setActionLoading((prev) => ({ ...prev, [key]: true }));
              try {
                const res = await axiosInstance.delete(`/admin/transactions/${id}`);
                await loadTransactions(false);
                toast.success(res.data?.message || 'Transaction deleted successfully.');
              } catch (err) {
                console.error('Failed to delete transaction', err);
                toast.error(err.response?.data?.message || 'Unable to delete transaction right now.');
              } finally {
                setActionLoading((prev) => ({ ...prev, [key]: false }));
              }
            }}
            disabled={Boolean(actionLoading[`${id}-delete`])}
            style={{
              background: '#f59e0b',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              opacity: actionLoading[`${id}-delete`] ? 0.6 : 1,
            }}
          >
            {actionLoading[`${id}-delete`] ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const deleteAllTransactions = () => {
    toast((t) => (
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '16px 20px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
      }}>
        <span style={{ flex: 1, fontSize: '14px', color: '#333' }}>Delete ALL transactions? Cannot undo.</span>
        <div style={{ display: 'flex', gap: '6px' }}>
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
              toast.dismiss(t.id);
              const key = 'delete-all';
              setActionLoading((prev) => ({ ...prev, [key]: true }));
              try {
                const res = await axiosInstance.delete('/admin/transactions');
                await loadTransactions(false);
                const deletedCount = res.data?.deletedCount ?? 0;
                toast.success(`Deleted ${deletedCount} transactions successfully.`);
              } catch (err) {
                console.error('Failed to delete all transactions', err);
                toast.error(err.response?.data?.message || 'Unable to delete all transactions right now.');
              } finally {
                setActionLoading((prev) => ({ ...prev, [key]: false }));
              }
            }}
            disabled={Boolean(actionLoading['delete-all'])}
            style={{
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              opacity: actionLoading['delete-all'] ? 0.6 : 1,
            }}
          >
            {actionLoading['delete-all'] ? 'Deleting...' : 'Delete All'}
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const showActionButtons = (tx) => tx.transactionStatus === 'UNDER_REVIEW' || tx.fraudStatus !== 'NORMAL';

  const filteredTransactions = transactions.filter((tx) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) {
      return true;
    }

    return String(tx.id).includes(q)
      || String(tx.userId).includes(q)
      || String(tx.userName || '').toLowerCase().includes(q)
      || String(tx.location || '').toLowerCase().includes(q);
  });

  if (loading) return <div>⏳ Loading...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>💳 All Transactions</h1>

      <div style={styles.toolbar}>
        <div style={styles.metaText}>
          Auto-refresh every 8s
          {lastUpdated ? ` • Last updated: ${lastUpdated.toLocaleTimeString()}` : ''}
        </div>
        <div style={styles.toolbarActions}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by transaction ID, user ID, user name, or location"
            style={styles.searchInput}
          />
          <button type="button" style={styles.refreshButton} onClick={() => loadTransactions(false)}>
            Refresh Now
          </button>
          <button
            type="button"
            style={styles.deleteAllButton}
            onClick={deleteAllTransactions}
            disabled={Boolean(actionLoading['delete-all'])}
          >
            {actionLoading['delete-all'] ? 'Deleting...' : 'Delete All'}
          </button>
        </div>
      </div>

      <div style={styles.stats}>
        <div>Total: <strong>{transactions.length}</strong></div>
        <div>Visible: <strong>{filteredTransactions.length}</strong></div>
        <div>Fraud: <strong>{transactions.filter(t => t.fraudStatus === 'FRAUD').length}</strong></div>
        <div>Suspicious: <strong>{transactions.filter(t => t.fraudStatus === 'SUSPICIOUS').length}</strong></div>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Payer</th>
              <th>User ID</th>
              <th>Recipient</th>
              <th>Amount</th>
              <th>Location</th>
              <th>Date</th>
              <th>Fraud</th>
              <th>Payment</th>
              <th>Risk</th>
              <th>Decision</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map(tx => (
              <tr key={tx.id}>
                <td>{tx.id}</td>
                <td>{tx.userName || '-'}</td>
                <td>{tx.userId}</td>
                <td>{tx.recipientPhone || '-'}</td>
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
                <td>{tx.paymentStatus || '-'}</td>
                <td>{(tx.riskScore * 100).toFixed(1)}%</td>
                <td>
                  {showActionButtons(tx) ? (
                    <div style={styles.actionCell}>
                      <button
                        type="button"
                        style={{ ...styles.actionBtn, ...styles.approveBtn }}
                        onClick={() => updateTransactionDecision(tx.id, 'approve')}
                        disabled={Boolean(actionLoading[`${tx.id}-approve`])}
                      >
                        {actionLoading[`${tx.id}-approve`] ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        style={{ ...styles.actionBtn, ...styles.blockBtn }}
                        onClick={() => updateTransactionDecision(tx.id, 'block')}
                        disabled={Boolean(actionLoading[`${tx.id}-block`])}
                      >
                        {actionLoading[`${tx.id}-block`] ? 'Blocking...' : 'Block'}
                      </button>
                    </div>
                  ) : (
                    <span style={styles.noAction}>-</span>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                    onClick={() => deleteTransaction(tx.id)}
                    disabled={Boolean(actionLoading[`${tx.id}-delete`])}
                  >
                    {actionLoading[`${tx.id}-delete`] ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={12} style={styles.emptyRow}>No transactions found for this search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', width: '100%' },
  title: { fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    gap: '8px',
    flexWrap: 'wrap',
  },
  toolbarActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  searchInput: {
    minWidth: '280px',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #d0d7de',
    fontSize: '12px',
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
  deleteAllButton: {
    border: 'none',
    background: '#8b0000',
    color: '#fff',
    borderRadius: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  },

  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px',
    marginBottom: '24px',
    padding: '18px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 14px 30px rgba(15, 23, 42, 0.08)',
  },
  tableWrapper: {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 16px 34px rgba(15, 23, 42, 0.09)',
    overflowX: 'auto',
    overflowY: 'hidden',
    WebkitOverflowScrolling: 'touch',
  },
  table: { width: '100%', minWidth: '900px', borderCollapse: 'collapse', fontSize: '13px' },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#fff',
  },
  badgeFraud: { background: '#F44336' },
  badgeSuspicious: { background: '#FF9800' },
  badgeNormal: { background: '#4CAF50' },
  actionCell: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  actionBtn: {
    border: 'none',
    borderRadius: '8px',
    padding: '6px 10px',
    color: '#fff',
    fontWeight: '700',
    fontSize: '11px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  approveBtn: { background: '#2E7D32' },
  blockBtn: { background: '#C62828' },
  deleteBtn: { background: '#6a1b9a' },
  noAction: { color: '#999' },
  emptyRow: {
    textAlign: 'center',
    color: '#666',
    padding: '14px',
  },
};

