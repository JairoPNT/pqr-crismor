import React, { useState, useEffect } from 'react';
import WelcomePage from './components/WelcomePage';
import LoginPage from './components/LoginPage';
import PublicTracker from './components/PublicTracker';
import Dashboard from './components/Dashboard';
import API_URL from './api';

function App() {
  const [view, setView] = useState('welcome');
  const [user, setUser] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [activeManagers, setActiveManagers] = useState([]);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Recuperar sesión al cargar
  useEffect(() => {
    const savedUser = localStorage.getItem('pqr_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setView('dashboard');
      } catch (err) {
        localStorage.removeItem('pqr_user');
      }
    }

    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/settings`);
        const data = await response.json();
        if (data.logoUrl) {
          setLogoUrl(data.logoUrl);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    const fetchActiveManagers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/active-managers`);
        const data = await response.json();
        setActiveManagers(data);
      } catch (err) {
        console.error('Error fetching active managers:', err);
      }
    };

    fetchSettings();
    fetchActiveManagers();
  }, []);

  // Lógica de inactividad (10 minutos)
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_LIMIT = 24 * 60 * 60 * 1000; // 24 horas

    const handleUserActivity = () => {
      setLastActivity(Date.now());
    };

    const checkInactivity = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity > INACTIVITY_LIMIT) {
        handleLogout();
        alert('Sesión cerrada por inactividad');
      }
    }, 10000); // Revisar cada 10 segundos

    // Listeners para actividad
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keypress', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    return () => {
      clearInterval(checkInactivity);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keypress', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
    };
  }, [user, lastActivity]);

  const handleLogout = () => {
    localStorage.removeItem('pqr_user');
    setUser(null);
    setView('welcome');
  };

  const renderView = () => {
    switch (view) {
      case 'welcome':
        return <WelcomePage onNavigate={setView} logo={logoUrl} activeManagers={activeManagers} />;
      case 'login':
        return (
          <LoginPage
            onLogin={(userData) => {
              setUser(userData);
              setView('dashboard');
              setLastActivity(Date.now());
            }}
            onBack={() => setView('welcome')}
            logo={logoUrl}
          />
        );
      case 'public':
        return <PublicTracker onBack={() => setView('welcome')} logo={logoUrl} />;
      case 'dashboard':
        return user ? (
          <Dashboard
            user={user}
            onLogout={handleLogout}
            initialLogo={logoUrl}
          />
        ) : (
          <WelcomePage onNavigate={setView} logo={logoUrl} activeManagers={activeManagers} />
        );
      default:
        return <WelcomePage onNavigate={setView} logo={logoUrl} activeManagers={activeManagers} />;
    }
  };

  return (
    <div className="App">
      {renderView()}
    </div>
  );
}

export default App;
