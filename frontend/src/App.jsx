import React, { useState } from 'react';
import WelcomePage from './components/WelcomePage';
import LoginPage from './components/LoginPage';
import PublicTracker from './components/PublicTracker';
import Dashboard from './components/Dashboard';

function App() {
  const [view, setView] = useState('welcome');
  const [user, setUser] = useState(null);

  const renderView = () => {
    switch (view) {
      case 'welcome':
        return <WelcomePage onNavigate={setView} />;
      case 'login':
        return <LoginPage onLogin={(userData) => { setUser(userData); setView('dashboard'); }} onBack={() => setView('welcome')} />;
      case 'public':
        return <PublicTracker onBack={() => setView('welcome')} />;
      case 'dashboard':
        return user ? <Dashboard user={user} onLogout={() => { setUser(null); setView('welcome'); }} /> : setView('login');
      default:
        return <WelcomePage onNavigate={setView} />;
    }
  };

  return (
    <div className="App">
      {renderView()}
    </div>
  );
}

export default App;
