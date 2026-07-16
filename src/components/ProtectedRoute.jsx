import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { subscribeToAuthChanges } from '../services/authService.js';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const [authState, setAuthState] = useState({
    loading: true,
    user: null,
  });

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setAuthState({ loading: false, user });
    });

    return unsubscribe;
  }, []);

  if (authState.loading) {
    return <div className="status">Controllo accesso...</div>;
  }

  if (!authState.user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
