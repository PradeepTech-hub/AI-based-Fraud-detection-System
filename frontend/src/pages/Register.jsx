import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import axiosInstance from '../api/axiosInstance';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      login(response.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>🛡️ FraudGuard</div>
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>Join FraudGuard today</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

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

          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p style={styles.linkText}>
          Already have an account? <Link to="/login" style={styles.link}>Sign in</Link>
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
  formGroup: { marginBottom: '16px' },
  label: { display: 'block', fontWeight: '600', marginBottom: '6px', color: '#333', fontSize: '13px' },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '13px',
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

