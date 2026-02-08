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

  useEffect(() => {
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
    fetchSettings();
  }, []);

  const renderView = () => {
    switch (view) {
      case 'welcome':
        return <WelcomePage onNavigate={setView} logo={logoUrl} />;
      case 'login':
        return <LoginPage onLogin={(userData) => { setUser(userData); setView('dashboard'); }} onBack={() => setView('welcome')} logo={logoUrl} />;
      case 'public':
        return <PublicTracker onBack={() => setView('welcome')} logo={logoUrl} />;
      case 'dashboard':
        return user ? (
          <Dashboard
            user={user}
            onLogout={() => { setUser(null); setView('welcome'); }}
            initialLogo={logoUrl}
          />
        ) : (
          <WelcomePage onNavigate={setView} logo={logoUrl} />
        );
      default:
        return <WelcomePage onNavigate={setView} logo={logoUrl} />;
    }
  };

  return (
    <div className="App">
      {renderView()}
    </div>
  );
}

export default App;
