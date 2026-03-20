import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewTransaction from './pages/NewTransaction';
import TransactionHistory from './pages/TransactionHistory';
import FraudStatus from './pages/FraudStatus';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import AdminDashboard from './pages/AdminDashboard';
import AdminTransactions from './pages/AdminTransactions';
import AdminFraudAlerts from './pages/AdminFraudAlerts';
import AdminUsers from './pages/AdminUsers';
import AdminReports from './pages/AdminReports';
import AdminSettings from './pages/AdminSettings';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* User Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/transaction/new"
            element={
              <PrivateRoute>
                <Layout>
                  <NewTransaction />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/transaction/history"
            element={
              <PrivateRoute>
                <Layout>
                  <TransactionHistory />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/transaction/fraud-status"
            element={
              <PrivateRoute>
                <Layout>
                  <FraudStatus />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Layout>
                  <Profile />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <PrivateRoute>
                <Layout>
                  <EditProfile />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute requiredRole="ADMIN">
                <Layout>
                  <AdminDashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <PrivateRoute requiredRole="ADMIN">
                <Layout>
                  <AdminTransactions />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/fraud-alerts"
            element={
              <PrivateRoute requiredRole="ADMIN">
                <Layout>
                  <AdminFraudAlerts />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <PrivateRoute requiredRole="ADMIN">
                <Layout>
                  <AdminUsers />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <PrivateRoute requiredRole="ADMIN">
                <Layout>
                  <AdminReports />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <PrivateRoute requiredRole="ADMIN">
                <Layout>
                  <AdminSettings />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* Root & 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
