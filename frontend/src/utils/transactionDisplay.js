// Shared helpers so Dashboard, Transaction History, and Fraud Status all
// describe a transaction's outcome the same way, instead of each page
// inventing its own label from raw fraudStatus/riskScore fields.

export function wasElevatedRisk(tx) {
  return typeof tx?.riskScore === 'number' && tx.riskScore >= 0.4;
}

// A transaction can carry a high original risk score but still end up
// fraudStatus=NORMAL because the user cleared an OTP challenge (or an admin
// approved it). The risk score/reason are preserved as-is by the backend -
// this only affects how the *outcome* is labeled in the UI.
export function getOutcomeLabel(tx) {
  if (!tx) return null;
  if (tx.fraudStatus === 'NORMAL' && wasElevatedRisk(tx)) {
    return 'OTP Verified';
  }
  return null;
}

export function getFraudCaseStatusLabel(status) {
  if (!status) return '-';
  const map = {
    OPEN: 'Open',
    INVESTIGATING: 'Investigating',
    RESOLVED: 'Resolved',
    FALSE_POSITIVE: 'False Positive',
    ESCALATED: 'Escalated',
  };
  return map[status] || status;
}
