import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

export default function EditProfile() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    bankName: '',
    bankAccountNumber: '',
    bankIfsc: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Fetch user profile on mount
    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get('/auth/profile');
        setForm({
          name: response.data.name,
          email: response.data.email,
          bankName: response.data.bankName || '',
          bankAccountNumber: response.data.bankAccountNumber || '',
          bankIfsc: response.data.bankIfsc || '',
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    // Validate
    if (!form.name.trim()) {
      setError('Name is required');
      setSubmitting(false);
      return;
    }

    if (!form.email.trim()) {
      setError('Email is required');
      setSubmitting(false);
      return;
    }

    if (form.bankAccountNumber && !/^\d{8,30}$/.test(form.bankAccountNumber.replace(/\s+/g, ''))) {
      setError('Bank account number must be 8 to 30 digits');
      setSubmitting(false);
      return;
    }

    if (form.bankIfsc && !/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(form.bankIfsc.replace(/\s+/g, ''))) {
      setError('Please enter a valid IFSC code');
      setSubmitting(false);
      return;
    }

    try {
      const normalizedBankAccount = form.bankAccountNumber.replace(/\s+/g, '').trim();
      const normalizedIfsc = form.bankIfsc.replace(/\s+/g, '').toUpperCase();
      const normalizedBankName = form.bankName.trim();

      await axiosInstance.put('/auth/profile', {
        name: form.name.trim(),
        email: form.email.trim(),
        bankName: normalizedBankName || null,
        bankAccountNumber: normalizedBankAccount || null,
        bankIfsc: normalizedIfsc || null,
      });
      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Edit Profile</h1>
        <p style={styles.subtitle}>Update your account information</p>

        {error && <div style={styles.errorBox}>{error}</div>}
        {success && <div style={styles.successBox}>{success}</div>}

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
            <label style={styles.label}>Email Address</label>
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
            <label style={styles.label}>Bank Name</label>
            <input
              type="text"
              name="bankName"
              value={form.bankName}
              onChange={handleChange}
              placeholder="e.g., State Bank of India"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Bank Account Number</label>
            <input
              type="text"
              name="bankAccountNumber"
              value={form.bankAccountNumber}
              onChange={handleChange}
              placeholder="Enter account number"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>IFSC Code</label>
            <input
              type="text"
              name="bankIfsc"
              value={form.bankIfsc}
              onChange={handleChange}
              placeholder="e.g., SBIN0001234"
              style={styles.input}
            />
          </div>

          <div style={styles.buttonGroup}>
            <button
              type="submit"
              disabled={submitting}
              style={styles.submitButton}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              style={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f8f9fa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    background: '#fff',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '500px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    marginBottom: '8px',
    color: '#1a1a2e',
  },
  subtitle: {
    fontSize: '14px',
    color: '#999',
    marginBottom: '24px',
  },
  errorBox: {
    background: '#F44336',
    color: '#fff',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  successBox: {
    background: '#4CAF50',
    color: '#fff',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#333',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '28px',
  },
  submitButton: {
    flex: 1,
    padding: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    background: '#f0f0f0',
    color: '#333',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontSize: '16px',
    color: '#999',
  },
};

