import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const loadUsers = async (isFirstLoad = false) => {
    if (isFirstLoad) {
      setLoading(true);
    }
    try {
      const res = await axiosInstance.get('/admin/users');
      setUsers(res.data || []);
    } catch (err) {
      console.error('Error:', err);
      toast.error(err.response?.data?.message || 'Unable to load user details. Please refresh.');
    } finally {
      if (isFirstLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadUsers(true);
  }, []);

  const toggleLock = async (userId, shouldLock) => {
    const key = `${userId}-${shouldLock ? 'lock' : 'unlock'}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const action = shouldLock ? 'block' : 'unblock';
      await axiosInstance.post(`/admin/users/${userId}/${action}`);
      await loadUsers(false);
      toast.success(`User ${shouldLock ? 'blocked' : 'unblocked'} successfully.`);
    } catch (err) {
      console.error('Failed to update user lock state:', err);
      toast.error(err.response?.data?.message || 'Unable to update account state.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const deleteUser = (userId) => {
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
        <span style={{ flex: 1, fontSize: '14px', color: '#333' }}>Delete user account #{userId}? Cannot undo.</span>
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
              const key = `${userId}-delete`;
              setActionLoading((prev) => ({ ...prev, [key]: true }));
              try {
                const res = await axiosInstance.delete(`/admin/users/${userId}`);
                await loadUsers(false);
                toast.success(res.data?.message || 'User deleted successfully.');
              } catch (err) {
                console.error('Failed to delete user:', err);
                toast.error(err.response?.data?.message || 'Unable to delete user right now.');
              } finally {
                setActionLoading((prev) => ({ ...prev, [key]: false }));
              }
            }}
            disabled={Boolean(actionLoading[`${userId}-delete`])}
            style={{
              background: '#6a1b9a',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              opacity: actionLoading[`${userId}-delete`] ? 0.6 : 1,
            }}
          >
            {actionLoading[`${userId}-delete`] ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const filteredUsers = users.filter((user) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) {
      return true;
    }
    return String(user.id).includes(q)
      || String(user.name || '').toLowerCase().includes(q)
      || String(user.email || '').toLowerCase().includes(q);
  });

  if (loading) return <div>⏳ Loading...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>👥 User Management</h1>
      <div style={styles.toolbar}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by user ID, name, or email"
          style={styles.searchInput}
        />
        <button type="button" style={styles.refreshButton} onClick={() => loadUsers(false)}>
          Refresh Now
        </button>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Account</th>
              <th>Joined</th>
              <th>Action</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span style={{
                    ...styles.badge,
                    ...(user.role === 'ADMIN' ? styles.badgeAdmin : styles.badgeUser)
                  }}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span style={{
                    ...styles.badge,
                    ...(user.accountLocked ? styles.badgeLocked : styles.badgeActive)
                  }}>
                    {user.accountLocked ? 'LOCKED' : 'ACTIVE'}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  {user.role === 'ADMIN' ? (
                    <span style={styles.naText}>-</span>
                  ) : user.accountLocked ? (
                    <button
                      type="button"
                      style={{ ...styles.actionBtn, ...styles.unlockBtn }}
                      onClick={() => toggleLock(user.id, false)}
                      disabled={Boolean(actionLoading[`${user.id}-unlock`])}
                    >
                      {actionLoading[`${user.id}-unlock`] ? 'Updating...' : 'Unblock'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      style={{ ...styles.actionBtn, ...styles.lockBtn }}
                      onClick={() => toggleLock(user.id, true)}
                      disabled={Boolean(actionLoading[`${user.id}-lock`])}
                    >
                      {actionLoading[`${user.id}-lock`] ? 'Updating...' : 'Block'}
                    </button>
                  )}
                </td>
                <td>
                  {user.role === 'ADMIN' ? (
                    <span style={styles.naText}>-</span>
                  ) : (
                    <button
                      type="button"
                      style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                      onClick={() => deleteUser(user.id)}
                      disabled={Boolean(actionLoading[`${user.id}-delete`])}
                    >
                      {actionLoading[`${user.id}-delete`] ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={8} style={styles.emptyRow}>No users found for this search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1000px', margin: '0 auto' },
  title: { fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  searchInput: {
    minWidth: '280px',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #d0d7de',
    fontSize: '12px',
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
  tableWrapper: {
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflowX: 'auto',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },

  badge: { padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', color: '#fff' },
  badgeAdmin: { background: '#e94560' },
  badgeUser: { background: '#667eea' },
  badgeActive: { background: '#2e7d32' },
  badgeLocked: { background: '#c62828' },
  actionBtn: {
    border: 'none',
    borderRadius: '6px',
    padding: '6px 10px',
    color: '#fff',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '11px',
  },
  lockBtn: { background: '#c62828' },
  unlockBtn: { background: '#2e7d32' },
  deleteBtn: { background: '#6a1b9a' },
  naText: { color: '#999' },
  emptyRow: {
    textAlign: 'center',
    color: '#666',
    padding: '14px',
  },
};

