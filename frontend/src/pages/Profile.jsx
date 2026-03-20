import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { formatCurrencyINR } from '../utils/currency';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [actionLoading, setActionLoading] = useState({ send: false, verify: false });
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  useEffect(() => {
    axiosInstance.get('/auth/profile')
      .then(res => {
        setProfile(res.data);
        setPhoneInput(res.data?.phone || '');
      })
      .catch(err => console.error('Error:', err))
      .finally(() => setLoading(false));
  }, []);

  const sendPhoneOtp = async () => {
    setFeedback({ type: '', text: '' });
    const phone = String(phoneInput || '').trim();

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setFeedback({ type: 'error', text: 'Enter a valid 10-digit Indian mobile number.' });
      return;
    }

    setActionLoading((prev) => ({ ...prev, send: true }));
    try {
      const res = await axiosInstance.post('/auth/profile/phone/send-otp', { phone });
      const demoOtp = res.data?.demoOtp;
      const message = res.data?.message || 'OTP sent successfully.';
      setFeedback({
        type: 'success',
        text: demoOtp ? `${message} Demo OTP: ${demoOtp}` : message,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Unable to process this request right now. Please try again.',
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, send: false }));
    }
  };

  const verifyPhoneOtp = async () => {
    setFeedback({ type: '', text: '' });
    const otp = String(otpInput || '').trim();

    if (!/^\d{6}$/.test(otp)) {
      setFeedback({ type: 'error', text: 'Enter a valid 6-digit OTP.' });
      return;
    }

    setActionLoading((prev) => ({ ...prev, verify: true }));
    try {
      const res = await axiosInstance.post('/auth/profile/phone/verify-otp', { otp });
      setProfile(res.data);
      setPhoneInput(res.data?.phone || '');
      setOtpInput('');
      setFeedback({ type: 'success', text: 'Phone number verified and updated successfully.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'OTP verification failed. Please try again.',
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, verify: false }));
    }
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Profile</h1>
        <button onClick={() => navigate('/profile/edit')} style={styles.editButton}>
          Edit Profile
        </button>
      </div>

      {profile?.accountLocked && (
        <div style={styles.alertBox}>
          ⚠️ Your account is currently blocked by the administrator. You will not be able to make new transactions until it is unblocked.
        </div>
      )}

      <div style={styles.phonePanel}>
        <h3 style={styles.phonePanelTitle}>Phone Verification for OTP Payments</h3>
        <p style={styles.phonePanelText}>
          Add your phone number and verify it to receive OTP for suspicious or large payments.
        </p>

        <div style={styles.phoneRow}>
          <input
            type="tel"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="Enter 10-digit phone number"
            style={styles.phoneInput}
          />
          <button
            type="button"
            onClick={sendPhoneOtp}
            disabled={actionLoading.send}
            style={styles.sendOtpButton}
          >
            {actionLoading.send ? 'Sending...' : 'Send OTP'}
          </button>
        </div>

        <div style={styles.phoneRow}>
          <input
            type="text"
            value={otpInput}
            onChange={(e) => setOtpInput(e.target.value)}
            placeholder="Enter 6-digit OTP"
            maxLength={6}
            style={styles.phoneInput}
          />
          <button
            type="button"
            onClick={verifyPhoneOtp}
            disabled={actionLoading.verify}
            style={styles.verifyOtpButton}
          >
            {actionLoading.verify ? 'Verifying...' : 'Verify OTP'}
          </button>
        </div>

        {feedback.text && (
          <div style={feedback.type === 'error' ? styles.errorBox : styles.successBox}>
            {feedback.text}
          </div>
        )}
      </div>

      <div style={styles.profileCard}>
        <div style={styles.avatar}>{profile?.name?.[0]?.toUpperCase()}</div>
        <div style={styles.info}>
          <div style={styles.infoRow}>
            <label style={styles.label}>Name</label>
            <div style={styles.value}>{profile?.name}</div>
          </div>
          <div style={styles.infoRow}>
            <label style={styles.label}>Email</label>
            <div style={styles.value}>{profile?.email}</div>
          </div>
          <div style={styles.infoRow}>
            <label style={styles.label}>Role</label>
            <div style={styles.value}>{profile?.role}</div>
          </div>
          <div style={styles.infoRow}>
            <label style={styles.label}>Phone</label>
            <div style={styles.value}>{profile?.phone || 'Not set'}</div>
          </div>
          <div style={styles.infoRow}>
            <label style={styles.label}>Phone Verification</label>
            <div style={profile?.phoneVerified ? styles.verifiedValue : styles.unverifiedValue}>
              {profile?.phoneVerified ? 'Verified' : 'Not Verified'}
            </div>
          </div>
          <div style={styles.infoRow}>
            <label style={styles.label}>Bank Name</label>
            <div style={styles.value}>{profile?.bankName || 'Not set'}</div>
          </div>
          <div style={styles.infoRow}>
            <label style={styles.label}>Bank Account Number</label>
            <div style={styles.value}>{profile?.bankAccountNumber || 'Not set'}</div>
          </div>
          <div style={styles.infoRow}>
            <label style={styles.label}>IFSC</label>
            <div style={styles.value}>{profile?.bankIfsc || 'Not set'}</div>
          </div>
          <div style={styles.infoRow}>
            <label style={styles.label}>Account Balance</label>
            <div style={styles.balanceValue}>{formatCurrencyINR(profile?.balance || 0)}</div>
          </div>
          <div style={styles.infoRow}>
            <label style={styles.label}>Member Since</label>
            <div style={styles.value}>{new Date(profile?.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '500px', margin: '0 auto', padding: '20px' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: { fontSize: '28px', fontWeight: '800', color: '#1a1a2e', margin: 0 },
  editButton: {
    padding: '8px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  profileCard: {
    background: '#fff',
    padding: '32px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    fontSize: '32px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  info: { textAlign: 'left' },
  infoRow: {
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #eee',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  value: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginTop: '8px',
  },
  balanceValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#667eea',
    marginTop: '8px',
  },
  verifiedValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0b8457',
    marginTop: '8px',
  },
  unverifiedValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#dc2626',
    marginTop: '8px',
  },
  alertBox: {
    background: '#fff4e5',
    border: '1px solid #ffb74d',
    padding: '14px 16px',
    borderRadius: '10px',
    marginBottom: '18px',
    color: '#5d4037',
    fontWeight: '600',
  },
  phonePanel: {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    padding: '18px',
    marginBottom: '18px',
  },
  phonePanelTitle: {
    margin: '0 0 8px',
    color: '#1a1a2e',
    fontSize: '18px',
  },
  phonePanelText: {
    margin: '0 0 12px',
    color: '#4b5563',
    fontSize: '13px',
    lineHeight: 1.5,
  },
  phoneRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
    flexWrap: 'wrap',
  },
  phoneInput: {
    flex: 1,
    minWidth: '220px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '13px',
  },
  sendOtpButton: {
    border: 'none',
    borderRadius: '8px',
    padding: '10px 14px',
    background: '#1f3a93',
    color: '#fff',
    fontWeight: '700',
    fontSize: '12px',
    cursor: 'pointer',
  },
  verifyOtpButton: {
    border: 'none',
    borderRadius: '8px',
    padding: '10px 14px',
    background: '#0b8457',
    color: '#fff',
    fontWeight: '700',
    fontSize: '12px',
    cursor: 'pointer',
  },
  errorBox: {
    background: 'rgba(220, 38, 38, 0.12)',
    borderLeft: '4px solid #dc2626',
    color: '#7f1d1d',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '13px',
    marginTop: '6px',
  },
  successBox: {
    background: 'rgba(22, 163, 74, 0.12)',
    borderLeft: '4px solid #16a34a',
    color: '#14532d',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '13px',
    marginTop: '6px',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    fontSize: '16px',
    color: '#999',
  },
};

