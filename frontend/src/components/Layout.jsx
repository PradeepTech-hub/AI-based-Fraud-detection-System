import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }

    return () => document.body.classList.remove('sidebar-open');
  }, [isSidebarOpen]);

  return (
    <div className="app-shell">
      <button
        type="button"
        className="mobile-menu-btn"
        onClick={() => setIsSidebarOpen((prev) => !prev)}
        aria-label="Toggle navigation"
        aria-expanded={isSidebarOpen}
      >
        {isSidebarOpen ? '✕' : '☰'}
      </button>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="app-main">
        <div className="page-transition">{children}</div>
      </main>
    </div>
  );
}

