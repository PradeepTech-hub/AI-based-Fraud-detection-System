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
  // Verified users land on a compact status row; changing the number re-opens the OTP flow.
  const [isChangingPhone, setIsChangingPhone] = useState(false);

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
      setIsChangingPhone(false);
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

      <div style={styles.profileCard}>
        <div style={styles.avatar}>{profile?.name?.[0]?.toUpperCase()}</div>

        <div style={styles.infoGrid}>
          <div style={styles.infoSection}>
            <h3 style={styles.sectionTitle}>Personal Information</h3>
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
              <label style={styles.label}>Member Since</label>
              <div style={styles.value}>{new Date(profile?.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          <div style={styles.infoSection}>
            <h3 style={styles.sectionTitle}>Bank &amp; Wallet</h3>
            <div style={styles.infoRow}>
              <label style={styles.label}>Bank Name</label>
              <div style={styles.value}>{profile?.bankName || 'Not set'}</div>
            </div>
            <div style={styles.infoRow}>
              <label style={styles.label}>Account Number</label>
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
          </div>
        </div>

        <div style={styles.phoneSection}>
          <h3 style={styles.sectionTitle}>Phone Verification for OTP Payments</h3>

          {profile?.phoneVerified && !isChangingPhone ? (
            <div style={styles.verifiedRow}>
              <span style={styles.verifiedBadge}>✓ Verified: {profile.phone}</span>
              <button
                type="button"
                onClick={() => setIsChangingPhone(true)}
                style={styles.changeNumberButton}
              >
                Change Number
              </button>
            </div>
          ) : (
            <>
              <p style={styles.phonePanelText}>
                {profile?.phoneVerified
                  ? 'Enter a new number below to replace your verified phone.'
                  : 'Add your phone number and verify it to receive OTP for suspicious or large payments.'}
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

              {profile?.phoneVerified && isChangingPhone && (
                <button
                  type="button"
                  onClick={() => { setIsChangingPhone(false); setFeedback({ type: '', text: '' }); }}
                  style={styles.cancelChangeButton}
                >
                  Cancel
                </button>
              )}
            </>
          )}

          {feedback.text && (
            <div style={feedback.type === 'error' ? styles.errorBox : styles.successBox}>
              {feedback.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '720px', margin: '0 auto', padding: '20px' },
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
    padding: '28px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  avatar: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    fontSize: '28px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: '24px',
    textAlign: 'left',
    marginBottom: '20px',
  },
  infoSection: {},
  sectionTitle: {
    margin: '0 0 12px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#1a1a2e',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '10px',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    flexShrink: 0,
  },
  value: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a2e',
    textAlign: 'right',
    wordBreak: 'break-word',
  },
  balanceValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#667eea',
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
  phoneSection: {
    textAlign: 'left',
    borderTop: '1px solid #f0f0f0',
    paddingTop: '18px',
  },
  phonePanelText: {
    margin: '0 0 12px',
    color: '#4b5563',
    fontSize: '13px',
    lineHeight: 1.5,
  },
  verifiedRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  verifiedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(22, 163, 74, 0.12)',
    color: '#14532d',
    borderRadius: '999px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '700',
  },
  changeNumberButton: {
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '6px 12px',
    background: '#fff',
    color: '#374151',
    fontWeight: '600',
    fontSize: '12px',
    cursor: 'pointer',
  },
  cancelChangeButton: {
    border: 'none',
    borderRadius: '8px',
    padding: '8px 12px',
    background: '#f0f0f0',
    color: '#374151',
    fontWeight: '600',
    fontSize: '12px',
    cursor: 'pointer',
    marginTop: '2px',
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

