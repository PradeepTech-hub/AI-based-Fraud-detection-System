import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import axiosInstance from '../api/axiosInstance';
import LocationDropdown from '../components/LocationDropdown';
import { formatCurrencyINR } from '../utils/currency';

export default function NewTransaction() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    amount: '',
    location: '',
    merchantName: '',
    recipientPhone: '',
    paymentMethod: 'UPI',
    upiVpa: '',
  });
  const [userBalance, setUserBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [accountLocked, setAccountLocked] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const [topupAmount, setTopupAmount] = useState('');
  const [topupMethod, setTopupMethod] = useState('UPI');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupMessage, setTopupMessage] = useState(null);

  const [paymentStep, setPaymentStep] = useState(null); // INITIATED | PROCESSING | SUCCESS | FAILED | ON_HOLD
  const [pollTxnId, setPollTxnId] = useState(null);
  const [paymentOtp, setPaymentOtp] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptOpenedForTxn, setReceiptOpenedForTxn] = useState(null);

  const refreshProfileState = async () => {
    try {
      const response = await axiosInstance.get('/auth/profile');
      setBackendUnavailable(false);
      setUserProfile(response.data || null);
      setUserBalance(response.data.balance || 0);
      const locked = Boolean(response.data.accountLocked);
      setAccountLocked(locked);
      return {
        locked,
        balance: response.data.balance || 0,
      };
    } catch (err) {
      setBackendUnavailable(true);
      throw err;
    }
  };

  // Fetch user balance on mount
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        await refreshProfileState();
      } catch (err) {
        setError('Backend server is unavailable. Please start backend on port 8081 and refresh.');
      } finally {
        setBalanceLoading(false);
      }
    };
    fetchBalance();
  }, []);

  // Auto-detect location (best effort). Falls back to manual entry.
  useEffect(() => {
    let cancelled = false;

    const reverseGeocode = async (lat, lon) => {
      // Free reverse geocoding (no API key). Respect rate limits.
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
      const res = await fetch(url, {
        headers: {
          // Some deployments require a UA.
          'Accept': 'application/json',
        },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const a = data?.address;
      const city = a?.city || a?.town || a?.village || a?.suburb || a?.county;
      const state = a?.state;
      const country = a?.country;
      return [city, state, country].filter(Boolean).join(', ');
    };

    const detect = async () => {
      try {
        if (!('geolocation' in navigator)) return;
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const { latitude, longitude } = pos.coords;
              const label = await reverseGeocode(latitude, longitude);
              if (!cancelled && label && !form.location) {
                setForm((prev) => ({ ...prev, location: label }));
              }
            } catch {
              // ignore
            }
          },
          () => {
            // permission denied or unavailable - ignore
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
        );
      } catch {
        // ignore
      }
    };

    detect();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAmountChange = (e) => {
    setForm({ ...form, amount: e.target.value });
  };

  const handleLocationChange = (location) => {
    setForm({ ...form, location });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let latestLocked = accountLocked;
    try {
      const profile = await refreshProfileState();
      latestLocked = profile.locked;
    } catch (err) {
      console.error('Failed to refresh profile before submit:', err);
    }

    if (latestLocked) {
      setError('Your account is currently blocked by the administrator. You cannot make payments until it is unblocked.');
      return;
    }

    if (backendUnavailable) {
      setError('Backend server is unavailable. Please start backend on port 8081 and refresh.');
      return;
    }

    setError(null);
    setResult(null);
    setPaymentStep(null);
    setPollTxnId(null);

    // Basic realistic validation
    const phoneOk = /^[6-9]\d{9}$/.test(String(form.recipientPhone || '').trim());
    if (!phoneOk) {
      setError('Please enter a valid 10-digit mobile number (starting from 6-9).');
      return;
    }

    if (form.paymentMethod === 'UPI' && !String(form.upiVpa || '').includes('@')) {
      setError('Please enter a valid UPI ID (e.g., name@bank).');
      return;
    }

    // Client-side validation
    const amount = parseFloat(form.amount);
    if (amount > userBalance) {
      setError(`Insufficient balance. You have ${formatCurrencyINR(userBalance)} but trying to transfer ${formatCurrencyINR(amount)}.`);
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.post('/transactions', {
        amount: amount,
        location: form.location,
        merchantName: form.merchantName,
        recipientPhone: String(form.recipientPhone || '').trim(),
        paymentMethod: form.paymentMethod,
        upiVpa: form.paymentMethod === 'UPI' ? String(form.upiVpa || '').trim() : null,
      });
      setResult(response.data);
      setForm({
        amount: '',
        location: '',
        merchantName: '',
        recipientPhone: '',
        paymentMethod: 'UPI',
        upiVpa: '',
      });
      setPaymentStep(response.data.paymentStatus || 'INITIATED');
      setPollTxnId(response.data.id);
      if (response.data?.demoOtp) {
        setPaymentOtp(response.data.demoOtp);
      }

      // Refresh balance after successful transaction
      await refreshProfileState();
    } catch (err) {
      setError(err.response?.data?.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async (e) => {
    e.preventDefault();
    setTopupMessage(null);
    setError(null);

    if (backendUnavailable) {
      setError('Backend server is unavailable. Please start backend on port 8081 and refresh.');
      return;
    }

    const amt = parseFloat(topupAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError('Please enter a valid top-up amount.');
      return;
    }

    setTopupLoading(true);
    try {
      const resp = await axiosInstance.post('/wallet/topup', {
        amount: amt,
        method: topupMethod,
      });
      setTopupMessage(resp.data?.message || 'Balance added');
      setTopupAmount('');
      // Refresh balance
      await refreshProfileState();
    } catch (err) {
      setError(err.response?.data?.message || 'Top-up failed');
    } finally {
      setTopupLoading(false);
    }
  };

  const verifyPaymentOtp = async () => {
    const otp = String(paymentOtp || '').trim();
    if (!/^\d{6}$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    if (!pollTxnId) {
      setError('Unable to verify OTP right now. Please retry the transaction.');
      return;
    }

    setOtpVerifying(true);
    setError(null);
    try {
      const resp = await axiosInstance.post(`/transactions/my/${pollTxnId}/verify-otp`, { otp });
      setResult(resp.data);
      setPaymentStep(resp.data?.paymentStatus || 'INITIATED');
      setPaymentOtp('');
      await refreshProfileState();
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const getSenderAccountMasked = () => {
    const account = String(userProfile?.bankAccountNumber || '').replace(/\s+/g, '').trim();
    if (/^\d{8,30}$/.test(account)) {
      return `XXXXXX${account.slice(-4)}`;
    }
    const userId = String(userProfile?.id || '').trim();
    if (userId) {
      return `FG-AC-${userId.padStart(6, '0')}`;
    }
    return 'N/A';
  };

  const downloadReceipt = () => {
    if (!result || String(result.paymentStatus || '').toUpperCase() !== 'SUCCESS') {
      return;
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const left = 48;
    const right = pageWidth - 48;
    let y = 52;

    const line = (text, size = 11, color = [31, 41, 55], weight = 'normal') => {
      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFont('helvetica', weight);
      doc.setFontSize(size);
      doc.text(String(text), left, y);
      y += size + 8;
    };

    const sectionTitle = (text) => {
      y += 4;
      doc.setDrawColor(203, 213, 225);
      doc.line(left, y, right, y);
      y += 16;
      line(text, 12, [30, 58, 138], 'bold');
    };

    const row = (label, value) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`${label}:`, left, y);

      doc.setFont('helvetica', 'normal');
      const text = String(value ?? 'N/A');
      const wrapped = doc.splitTextToSize(text, right - (left + 130));
      doc.text(wrapped, left + 130, y);
      y += Math.max(16, wrapped.length * 14);
    };

    line('FraudGuard Payments Bank', 18, [15, 23, 42], 'bold');
    line('Digital Payment Receipt', 12, [51, 65, 85], 'bold');
    line(`Receipt Generated: ${new Date().toLocaleString()}`, 10, [100, 116, 139]);

    sectionTitle('Transaction Details');
    row('Transaction ID', result.id || 'N/A');
    row('Payment Reference', result.paymentReference || 'N/A');
    row('Status', result.paymentStatus || 'N/A');
    row('Amount', formatCurrencyINR(result.amount || 0));
    row('Processed At', result.timestamp ? new Date(result.timestamp).toLocaleString() : new Date().toLocaleString());
    row('Location', result.location || 'N/A');

    sectionTitle('Sender Bank Details');
    row('Sender Name', userProfile?.name || 'N/A');
    row('Bank Name', userProfile?.bankName || 'FraudGuard Payments Bank');
    row('Account (masked)', getSenderAccountMasked());
    row('IFSC', userProfile?.bankIfsc || 'FRGD0001024');

    sectionTitle('Beneficiary Details');
    row('Recipient Mobile', result.recipientPhone || 'N/A');
    row('UPI ID', result.upiVpa || 'N/A');
    row('Merchant / Note', result.merchantName || '-');

    y += 10;
    doc.setDrawColor(226, 232, 240);
    doc.line(left, y, right, y);
    y += 18;
    line('This is a system-generated receipt.', 9, [100, 116, 139]);

    doc.save(`fraudguard-receipt-${result.id || 'transaction'}.pdf`);
  };

  // Poll for near-real-time payment status updates
  useEffect(() => {
    if (!pollTxnId) return;
    let stopped = false;
    const interval = setInterval(async () => {
      try {
        const resp = await axiosInstance.get(`/transactions/my/${pollTxnId}`);
        if (stopped) return;
        const next = resp.data?.paymentStatus;
        if (next) setPaymentStep(next);
        setResult((prev) => {
          if (!prev) {
            return resp.data;
          }
          const merged = { ...prev, ...resp.data };
          if (!merged.demoOtp && prev.demoOtp) {
            merged.demoOtp = prev.demoOtp;
          }
          return merged;
        });
        if (resp.data?.demoOtp) {
          setPaymentOtp((prev) => prev || resp.data.demoOtp);
        }

        if (['SUCCESS', 'FAILED', 'ON_HOLD'].includes(String(next || '').toUpperCase())) {
          clearInterval(interval);
        }
      } catch {
        // ignore transient polling errors
      }
    }, 1000);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [pollTxnId]);

  useEffect(() => {
    const status = String(paymentStep || '').toUpperCase();
    if (status !== 'SUCCESS') {
      return;
    }
    const txnId = result?.id;
    if (!txnId || receiptOpenedForTxn === txnId) {
      return;
    }
    setShowReceiptModal(true);
    setReceiptOpenedForTxn(txnId);
  }, [paymentStep, result, receiptOpenedForTxn]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Make a New Transaction</h1>

      {!balanceLoading && (
        <div style={styles.balanceBox}>
          <div style={styles.balanceLabel}>Current Balance</div>
          <div style={styles.balanceAmount}>{formatCurrencyINR(userBalance)}</div>
        </div>
      )}

      {accountLocked && (
        <div style={styles.alertBox}>
          ⚠️ Your account is currently blocked by the administrator. You cannot make transactions until it is unblocked.
        </div>
      )}

      {backendUnavailable && (
        <div style={styles.backendDownBox}>
          ⚠️ Backend server not reachable at http://localhost:8081. Start backend and refresh this page.
        </div>
      )}

      {!balanceLoading && (
        <div style={styles.formBox}>
          <h2 style={styles.sectionTitle}>Add Balance</h2>
          <form onSubmit={handleTopUp}>
            <div style={styles.formRow}>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.label}>Top-up Amount (INR)</label>
                <input
                  type="number"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  required
                  style={styles.input}
                />
              </div>

              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.label}>Method</label>
                <select
                  value={topupMethod}
                  onChange={(e) => setTopupMethod(e.target.value)}
                  style={styles.input}
                >
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="NETBANKING">Net Banking</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={topupLoading} style={styles.button}>
              {topupLoading ? 'Adding...' : 'Add Balance'}
            </button>
            {topupMessage && <div style={styles.successBox}>{topupMessage}</div>}
          </form>
        </div>
      )}

      <div style={styles.formBox}>
        <h2 style={styles.sectionTitle}>Payment Details</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.formRow}>
            <div style={{ ...styles.formGroup, flex: 1 }}>
              <label style={styles.label}>Recipient Mobile Number</label>
              <input
                type="tel"
                value={form.recipientPhone}
                onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })}
                placeholder="10-digit mobile (e.g., 9876543210)"
                required
                style={styles.input}
              />
            </div>
            <div style={{ ...styles.formGroup, flex: 1 }}>
              <label style={styles.label}>Payment Method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                style={styles.input}
              >
                <option value="UPI">UPI</option>
                <option value="WALLET">Wallet</option>
                <option value="CARD">Card</option>
                <option value="NETBANKING">Net Banking</option>
              </select>
            </div>
          </div>

          {form.paymentMethod === 'UPI' && (
            <div style={styles.formGroup}>
              <label style={styles.label}>UPI ID</label>
              <input
                type="text"
                value={form.upiVpa}
                onChange={(e) => setForm({ ...form, upiVpa: e.target.value })}
                placeholder="name@bank"
                required
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Merchant / Note (optional)</label>
            <input
              type="text"
              value={form.merchantName}
              onChange={(e) => setForm({ ...form, merchantName: e.target.value })}
              placeholder="e.g., Swiggy / Electricity bill"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Amount (INR)</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleAmountChange}
              step="0.01"
              min="0"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Location</label>
            <LocationDropdown value={form.location} onChange={handleLocationChange} />
          </div>

          <button type="submit" disabled={loading || balanceLoading || accountLocked} style={styles.button}>
            {loading ? 'Processing...' : 'Submit Transaction'}
          </button>
        </form>

        {paymentStep && (
          <div style={styles.paymentTrack}>
            <div style={styles.paymentTrackTitle}>Payment Status: <strong>{paymentStep}</strong></div>
            <div style={styles.paymentTrackSub}>
              {paymentStep === 'INITIATED' && 'Connecting to payment gateway…'}
              {paymentStep === 'PROCESSING' && 'Processing transfer in real-time…'}
              {paymentStep === 'SUCCESS' && 'Payment completed. Receipt generated.'}
              {paymentStep === 'ON_HOLD' && 'Payment on hold due to security checks.'}
              {paymentStep === 'FAILED' && 'Payment failed. Please try again.'}
            </div>
          </div>
        )}
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {result && (
        <div style={{
          ...styles.resultBox,
          ...(result.fraudStatus === 'FRAUD' ? styles.resultFraud : result.fraudStatus === 'SUSPICIOUS' ? styles.resultSuspicious : styles.resultNormal)
        }}>
          <div style={styles.resultIcon}>
            {result.fraudStatus === 'FRAUD' ? '⛔' : result.fraudStatus === 'SUSPICIOUS' ? '⚠️' : '✓'}
          </div>
          <div style={styles.resultContent}>
            <h3 style={styles.resultTitle}>{result.fraudStatus}</h3>
            <p style={styles.resultMessage}>{result.message}</p>
            <div style={styles.resultDetails}>
              <div>
                <strong>Amount:</strong> {formatCurrencyINR(result.amount)}
              </div>
              <div>
                <strong>Recipient:</strong> {result.recipientPhone || '-'}
              </div>
              <div>
                <strong>Payment Method:</strong> {result.paymentMethod || '-'}
              </div>
              {result.upiVpa && (
                <div>
                  <strong>UPI:</strong> {result.upiVpa}
                </div>
              )}
              {result.demoOtp && (
                <div>
                  <strong>Demo OTP:</strong> {result.demoOtp}
                </div>
              )}
              {result.merchantName && (
                <div>
                  <strong>Merchant/Note:</strong> {result.merchantName}
                </div>
              )}
              <div>
                <strong>Location:</strong> {result.location}
              </div>
              <div>
                <strong>Risk Score:</strong> {(result.riskScore * 100).toFixed(2)}%
              </div>
              <div>
                <strong>Transaction ID:</strong> {result.id}
              </div>
              <div>
                <strong>Payment Reference:</strong> {result.paymentReference || '-'}
              </div>
              <div>
                <strong>Payment Status:</strong> {result.paymentStatus || '-'}
              </div>
              {String(result.paymentStatus || '').toUpperCase() === 'OTP_REQUIRED' && (
                <div style={styles.otpBox}>
                  <div style={styles.otpTitle}>Enter OTP within 90 seconds to complete this payment</div>
                  {result.demoOtp && (
                    <div style={styles.devOtpHint}>Dev mode OTP available: <strong>{result.demoOtp}</strong></div>
                  )}
                  <div style={styles.otpRow}>
                    <input
                      type="text"
                      value={paymentOtp}
                      onChange={(e) => setPaymentOtp(e.target.value)}
                      placeholder="6-digit OTP"
                      maxLength={6}
                      style={styles.otpInput}
                    />
                    <button
                      type="button"
                      onClick={verifyPaymentOtp}
                      disabled={otpVerifying}
                      style={styles.otpButton}
                    >
                      {otpVerifying ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                </div>
              )}
              <div>
                <strong>Remaining Balance:</strong> {formatCurrencyINR(result.remainingBalance)}
              </div>
              {String(result.paymentStatus || '').toUpperCase() === 'SUCCESS' && (
                <div style={styles.receiptActions}>
                  <button type="button" style={styles.receiptViewButton} onClick={() => setShowReceiptModal(true)}>
                    View Receipt
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showReceiptModal && result && String(result.paymentStatus || '').toUpperCase() === 'SUCCESS' && (
        <div style={styles.receiptOverlay}>
          <div style={styles.receiptModal}>
            <div style={styles.receiptHeader}>
              <h3 style={styles.receiptTitle}>Payment Receipt</h3>
              <button type="button" style={styles.receiptCloseX} onClick={() => setShowReceiptModal(false)}>×</button>
            </div>

            <div style={styles.receiptBody}>
              <div style={styles.receiptRow}><strong>Transaction ID:</strong> <span>{result.id || 'N/A'}</span></div>
              <div style={styles.receiptRow}><strong>Payment Reference:</strong> <span>{result.paymentReference || 'N/A'}</span></div>
              <div style={styles.receiptRow}><strong>Status:</strong> <span>{result.paymentStatus || 'N/A'}</span></div>
              <div style={styles.receiptRow}><strong>Amount:</strong> <span>{formatCurrencyINR(result.amount || 0)}</span></div>
              <div style={styles.receiptRow}><strong>Processed At:</strong> <span>{result.timestamp ? new Date(result.timestamp).toLocaleString() : new Date().toLocaleString()}</span></div>

              <div style={styles.receiptSection}>Sender Bank Details</div>
              <div style={styles.receiptRow}><strong>Sender Name:</strong> <span>{userProfile?.name || 'N/A'}</span></div>
              <div style={styles.receiptRow}><strong>Bank Name:</strong> <span>{userProfile?.bankName || 'FraudGuard Payments Bank'}</span></div>
              <div style={styles.receiptRow}><strong>Account (masked):</strong> <span>{getSenderAccountMasked()}</span></div>
              <div style={styles.receiptRow}><strong>IFSC:</strong> <span>{userProfile?.bankIfsc || 'FRGD0001024'}</span></div>

              <div style={styles.receiptSection}>Beneficiary Details</div>
              <div style={styles.receiptRow}><strong>Recipient Mobile:</strong> <span>{result.recipientPhone || 'N/A'}</span></div>
              <div style={styles.receiptRow}><strong>UPI ID:</strong> <span>{result.upiVpa || 'N/A'}</span></div>
              <div style={styles.receiptRow}><strong>Merchant/Note:</strong> <span>{result.merchantName || '-'}</span></div>
            </div>

            <div style={styles.receiptFooter}>
              <button type="button" style={styles.receiptDownloadButton} onClick={downloadReceipt}>Download Receipt</button>
              <button type="button" style={styles.receiptCloseButton} onClick={() => setShowReceiptModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '600px', margin: '0 auto' },
  title: { fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#1a1a2e' },
  balanceBox: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '24px',
    textAlign: 'center',
  },
  balanceLabel: { fontSize: '14px', fontWeight: '600', opacity: 0.9, marginBottom: '8px' },
  balanceAmount: { fontSize: '28px', fontWeight: 'bold' },
  formBox: {
    background: '#fff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '24px',
  },
  sectionTitle: { margin: '0 0 14px', fontSize: '16px', fontWeight: '700', color: '#1a1a2e' },
  formRow: { display: 'flex', gap: '14px', flexWrap: 'wrap' },
  formGroup: { marginBottom: '20px' },
  label: { display: 'block', fontWeight: '600', marginBottom: '8px', color: '#1a1a2e' },
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
    transition: 'all 0.2s',
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
  backendDownBox: {
    background: '#fff1f2',
    border: '1px solid #ef9a9a',
    padding: '14px 16px',
    borderRadius: '10px',
    marginBottom: '18px',
    color: '#7f1d1d',
    fontWeight: '700',
  },
  errorBox: {
    background: '#F44336',
    color: '#fff',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  successBox: {
    background: '#4CAF50',
    color: '#fff',
    padding: '12px',
    borderRadius: '8px',
    marginTop: '12px',
  },
  paymentTrack: {
    marginTop: '14px',
    padding: '14px',
    borderRadius: '10px',
    background: '#f6f7ff',
    border: '1px solid #e6e8ff',
  },
  paymentTrackTitle: { fontSize: '14px', fontWeight: '700', color: '#1a1a2e', marginBottom: '6px' },
  paymentTrackSub: { fontSize: '13px', color: '#555' },
  resultBox: {
    display: 'flex',
    gap: '16px',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
  },
  resultFraud: { background: 'rgba(244, 67, 54, 0.1)', borderLeft: '4px solid #F44336' },
  resultSuspicious: { background: 'rgba(255, 152, 0, 0.1)', borderLeft: '4px solid #FF9800' },
  resultNormal: { background: 'rgba(76, 175, 80, 0.1)', borderLeft: '4px solid #4CAF50' },
  resultIcon: { fontSize: '28px', marginTop: '4px' },
  resultContent: { flex: 1 },
  resultTitle: { margin: '0 0 8px', fontSize: '18px' },
  resultMessage: { margin: '0 0 12px', fontSize: '14px', color: '#666' },
  resultDetails: {
    fontSize: '13px',
    lineHeight: '1.8',
    color: '#555',
  },
  receiptActions: {
    marginTop: '8px',
  },
  receiptViewButton: {
    border: 'none',
    borderRadius: '6px',
    padding: '8px 12px',
    background: '#0b8457',
    color: '#fff',
    fontWeight: '700',
    fontSize: '12px',
    cursor: 'pointer',
  },
  receiptOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1200,
    padding: '16px',
  },
  receiptModal: {
    width: '100%',
    maxWidth: '560px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
    overflow: 'hidden',
  },
  receiptHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    borderBottom: '1px solid #e5e7eb',
    background: '#f8fafc',
  },
  receiptTitle: {
    margin: 0,
    color: '#0f172a',
    fontSize: '18px',
  },
  receiptCloseX: {
    border: 'none',
    background: 'transparent',
    fontSize: '24px',
    lineHeight: 1,
    cursor: 'pointer',
    color: '#334155',
  },
  receiptBody: {
    padding: '14px 16px',
    maxHeight: '62vh',
    overflowY: 'auto',
    display: 'grid',
    gap: '8px',
  },
  receiptSection: {
    marginTop: '8px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#1e3a8a',
    borderTop: '1px dashed #cbd5e1',
    paddingTop: '8px',
  },
  receiptRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    fontSize: '13px',
    color: '#334155',
  },
  receiptFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    padding: '12px 16px',
    borderTop: '1px solid #e5e7eb',
    background: '#f8fafc',
  },
  receiptDownloadButton: {
    border: 'none',
    borderRadius: '6px',
    padding: '8px 12px',
    background: '#1f3a93',
    color: '#fff',
    fontWeight: '700',
    fontSize: '12px',
    cursor: 'pointer',
  },
  receiptCloseButton: {
    border: 'none',
    borderRadius: '6px',
    padding: '8px 12px',
    background: '#64748b',
    color: '#fff',
    fontWeight: '700',
    fontSize: '12px',
    cursor: 'pointer',
  },
  otpBox: {
    marginTop: '8px',
    marginBottom: '8px',
    padding: '10px',
    borderRadius: '8px',
    background: 'rgba(31,58,147,0.08)',
    border: '1px solid rgba(31,58,147,0.2)',
  },
  otpTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#1f3a93',
    marginBottom: '8px',
  },
  devOtpHint: {
    fontSize: '12px',
    color: '#14532d',
    background: 'rgba(22, 163, 74, 0.12)',
    borderRadius: '6px',
    padding: '6px 8px',
    marginBottom: '8px',
  },
  otpRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  otpInput: {
    border: '1px solid #c7d2fe',
    borderRadius: '6px',
    padding: '8px 10px',
    minWidth: '140px',
    fontSize: '13px',
  },
  otpButton: {
    border: 'none',
    borderRadius: '6px',
    padding: '8px 10px',
    background: '#1f3a93',
    color: '#fff',
    fontWeight: '700',
    fontSize: '12px',
    cursor: 'pointer',
  },
};

