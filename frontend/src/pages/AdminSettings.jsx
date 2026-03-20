export default function AdminSettings() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>System Settings</h1>
      <p style={styles.text}>
        This section is reserved for future admin-level configuration such as
        risk thresholds, notification channels, and model version rollout.
      </p>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Current Mode</h3>
        <p style={styles.cardText}>Default platform settings are active.</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    color: '#1f2937',
  },
  title: {
    marginBottom: '10px',
    fontSize: '28px',
    fontWeight: 700,
  },
  text: {
    marginBottom: '20px',
    color: '#4b5563',
    maxWidth: '760px',
    lineHeight: 1.5,
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '16px',
    maxWidth: '520px',
  },
  cardTitle: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: 600,
  },
  cardText: {
    margin: 0,
    color: '#6b7280',
  },
};

