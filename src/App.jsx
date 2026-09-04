import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [currentPath, setCurrentPath] = useState(
    window.location.hash ? window.location.hash.replace('#', '') : '/login'
  );

  useEffect(() => {
    const handleHashChange = () => {
      const path = window.location.hash ? window.location.hash.replace('#', '') : '/login';
      setCurrentPath(path);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path) => {
    window.location.hash = path;
    setCurrentPath(path);
  };

  if (currentPath === '/forgot-password') {
    return <ForgotPassword onNavigate={navigate} />;
  }

  if (currentPath === '/dashboard') {
    return <Dashboard onNavigate={navigate} />;
  }

  return <Login onNavigate={navigate} />;
}
