import { useContext } from 'react';
import { AuthContext } from './AuthContextImpl';

export function useAuth() {
  return useContext(AuthContext);
}
