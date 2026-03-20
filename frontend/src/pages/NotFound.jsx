export default function NotFound() {
  return (
    <div style={styles.container}>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
  },
};

