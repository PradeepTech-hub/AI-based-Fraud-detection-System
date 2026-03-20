import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import axiosInstance from '../api/axiosInstance';

export default function Login() {
  const isDev = import.meta.env.DEV;
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isDev) {
      console.debug('[FraudGuard][LOGIN] Attempting login', {
        email: form.email,
        apiBaseUrl: axiosInstance.defaults.baseURL,
      });
    }

    try {
      const response = await axiosInstance.post('/auth/login', form);
      login(response.data);

      if (isDev) {
        console.debug('[FraudGuard][LOGIN] Login success', {
          email: response.data?.email,
          role: response.data?.role,
        });
      }

      navigate('/dashboard');
    } catch (err) {
      if (isDev) {
        console.error('[FraudGuard][LOGIN] Login failed', {
          status: err?.response?.status,
          payload: err?.response?.data,
          message: err?.message,
        });
      }

      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getLoginErrorMessage = (err) => {
    const status = err?.response?.status;
    const backendMessage = err?.response?.data?.message;

    if (backendMessage) {
      return backendMessage;
    }

    if (status === 401) {
      return 'Invalid email or password.';
    }

    if (status === 403) {
      return 'Access forbidden (403). This account may not have access, or backend auth rules rejected the request.';
    }

    if (!status) {
      return `Cannot reach backend. Expected API: ${axiosInstance.defaults.baseURL}`;
    }

    return `Login failed (HTTP ${status}).`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>🛡️ FraudGuard</div>
        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.subtitle}>Sign in to your account</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.linkText}>
          Don't have an account? <Link to="/register" style={styles.link}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    background: '#fff',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    width: '100%',
    maxWidth: '400px',
  },
  logo: {
    fontSize: '28px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  title: { fontSize: '24px', fontWeight: 'bold', textAlign: 'center', margin: '0 0 8px' },
  subtitle: { textAlign: 'center', color: '#999', margin: '0 0 24px', fontSize: '14px' },
  errorBox: {
    background: '#F44336',
    color: '#fff',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  formGroup: { marginBottom: '20px' },
  label: { display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333' },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '12px',
  },
  linkText: { textAlign: 'center', color: '#999', fontSize: '14px', marginTop: '20px' },
  link: { color: '#667eea', textDecoration: 'none', fontWeight: '600' },
};

