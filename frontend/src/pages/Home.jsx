import { useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-header-content">
          <div className="home-logo">FraudGuard</div>
          <nav className="home-nav">
            <a href="#features" className="home-nav-link">Features</a>
            <a href="#security" className="home-nav-link">Security</a>
            <button onClick={() => navigate('/login')} className="home-nav-btn">Sign In</button>
            <button onClick={() => navigate('/register')} className="home-nav-btn home-nav-btn-primary">Sign Up</button>
          </nav>
        </div>
      </header>

      <section className="home-hero">
        <div className="home-hero-content fade-in-up">
          <h1 className="home-hero-title">Advanced Fraud Detection System</h1>
          <p className="home-hero-subtitle">Protect your transactions with AI-powered real-time fraud detection. Secure, reliable, and easy to use.</p>
          <div className="home-hero-buttons">
            <button onClick={() => navigate('/register')} className="home-cta-btn">Get Started Free</button>
            <button onClick={() => navigate('/login')} className="home-secondary-btn">Sign In</button>
          </div>
        </div>
      </section>

      <section className="home-features" id="features">
        <h2 className="home-section-title">Key Features</h2>
        <div className="home-feature-grid">
          <article className="home-feature-card fade-in-up" style={{ animationDelay: '0.05s' }}>
            <div className="home-feature-icon">RT</div>
            <h3 className="home-feature-title">Real-Time Detection</h3>
            <p className="home-feature-text">AI-powered algorithms analyze transactions in real-time to identify fraudulent patterns instantly.</p>
          </article>
          <article className="home-feature-card fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="home-feature-icon">LI</div>
            <h3 className="home-feature-title">Location Intelligence</h3>
            <p className="home-feature-text">Auto-detect location or manually select with smart suggestions for enhanced fraud detection accuracy.</p>
          </article>
          <article className="home-feature-card fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="home-feature-icon">BT</div>
            <h3 className="home-feature-title">Balance Tracking</h3>
            <p className="home-feature-text">Monitor your account balance in real-time and receive instant alerts for all transactions.</p>
          </article>
          <article className="home-feature-card fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="home-feature-icon">DA</div>
            <h3 className="home-feature-title">Detailed Analytics</h3>
            <p className="home-feature-text">Comprehensive dashboard with transaction history, fraud alerts, and risk score analysis.</p>
          </article>
          <article className="home-feature-card fade-in-up" style={{ animationDelay: '0.25s' }}>
            <div className="home-feature-icon">BS</div>
            <h3 className="home-feature-title">Bank-Level Security</h3>
            <p className="home-feature-text">Enterprise-grade encryption and security protocols to keep your data safe and secure.</p>
          </article>
          <article className="home-feature-card fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="home-feature-icon">FT</div>
            <h3 className="home-feature-title">Fast Transactions</h3>
            <p className="home-feature-text">Lightning-fast transaction processing with minimal latency for seamless user experience.</p>
          </article>
        </div>
      </section>

      <section className="home-security" id="security">
        <div className="home-security-content">
          <h2 className="home-section-title">Enterprise-Grade Security</h2>
          <div className="home-security-grid">
            <article className="home-security-item fade-in-up" style={{ animationDelay: '0.08s' }}>
              <h4 className="home-security-title">End-to-End Encryption</h4>
              <p className="home-security-text">All data transmitted is encrypted using industry-standard TLS 1.3 protocols.</p>
            </article>
            <article className="home-security-item fade-in-up" style={{ animationDelay: '0.12s' }}>
              <h4 className="home-security-title">AI-Powered Detection</h4>
              <p className="home-security-text">Machine learning models trained on millions of transactions for accurate fraud detection.</p>
            </article>
            <article className="home-security-item fade-in-up" style={{ animationDelay: '0.16s' }}>
              <h4 className="home-security-title">Real-Time Monitoring</h4>
              <p className="home-security-text">24/7 monitoring and alerting system for immediate threat detection and response.</p>
            </article>
            <article className="home-security-item fade-in-up" style={{ animationDelay: '0.2s' }}>
              <h4 className="home-security-title">PCI DSS Compliant</h4>
              <p className="home-security-text">Fully compliant with Payment Card Industry Data Security Standard requirements.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="home-cta">
        <h2 className="home-cta-title">Ready to Secure Your Transactions?</h2>
        <p className="home-cta-text">Join thousands of users protecting their finances with FraudGuard.</p>
        <button onClick={() => navigate('/register')} className="home-cta-btn home-cta-btn-large">Start Your Free Trial Today</button>
      </section>

      <footer className="home-footer">
        <div className="home-footer-content">
          <div>
            <h4 className="home-footer-title">FraudGuard</h4>
            <p className="home-footer-text">Advanced fraud detection for modern banking.</p>
          </div>
          <div>
            <h4 className="home-footer-title">Quick Links</h4>
            <ul className="home-footer-links">
              <li><a href="#" className="home-footer-link">Privacy Policy</a></li>
              <li><a href="#" className="home-footer-link">Terms of Service</a></li>
              <li><a href="#" className="home-footer-link">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h4 className="home-footer-title">Support</h4>
            <ul className="home-footer-links">
              <li><a href="#" className="home-footer-link">Documentation</a></li>
              <li><a href="#" className="home-footer-link">Help Center</a></li>
              <li><a href="#" className="home-footer-link">API Reference</a></li>
            </ul>
          </div>
        </div>
        <div className="home-footer-bottom">
          <p className="home-footer-bottom-text">© 2026 FraudGuard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}


