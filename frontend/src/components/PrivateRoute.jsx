import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function PrivateRoute({ children, requiredRole }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/dashboard" replace />;

  return children;
}

