import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const userLinks = [
  { to: '/dashboard', label: '🏠 Dashboard' },
  { to: '/transaction/new', label: '💳 Make Transaction' },
  { to: '/transaction/history', label: '📋 Transaction History' },
  { to: '/transaction/fraud-status', label: '⚠️ Fraud Status' },
  { to: '/profile', label: '👤 Profile' },
];

const adminLinks = [
  { to: '/admin/dashboard', label: '🏠 Admin Dashboard' },
  { to: '/admin/transactions', label: '💳 Transactions' },
  { to: '/admin/fraud-alerts', label: '🚨 Fraud Alerts' },
  { to: '/admin/users', label: '👥 User Management' },
  { to: '/admin/reports', label: '📊 Reports' },
  { to: '/admin/settings', label: '⚙️ System Settings' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === 'ADMIN' ? adminLinks : userLinks;

  const handleLogout = () => {
    logout();
    onClose?.();
    navigate('/login');
  };

  return (
    <>
      <button
        type="button"
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-label="Close navigation"
      />

      <aside className={`sidebar ${isOpen ? 'active' : ''}`}>
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">🛡️</span>
          <span className="sidebar-logo-text">FraudGuard</span>
        </div>

        <div className="sidebar-user-info">
          <div className="sidebar-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <div>
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button className="sidebar-logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </aside>
    </>
  );
}

