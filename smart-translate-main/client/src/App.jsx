import React, { useContext, useState } from 'react';
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import TranslatorPage from './pages/TranslatorPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import './App.css';
import AuthContext from './context/AuthContext.jsx';
import { useToast } from './context/ToastContext.jsx';

function RequireAuth({ children }) {
  const { user, token } = useContext(AuthContext);
  const location = useLocation();
  // Allow access if we have a user OR a token (token may be set before user state updates).
  const storedToken = (!token && typeof window !== 'undefined') ? sessionStorage.getItem('token') : null;
  if (!user && !token && !storedToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function App() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
  toast.info('Logged out successfully.');
    navigate('/login', { replace: true });
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="main-header glass-nav">
        <div className="nav-container">
          <Link to="/" className="logo" onClick={closeMobileMenu}>
            <img src="/logo1.png" alt="Smart Translator Logo" className="logo-img" />
            Smart Translator
          </Link>
          
          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu">
            {mobileMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>

          <nav className={`nav-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            {user ? (
              <>
                <Link to="/app" className="nav-link" onClick={closeMobileMenu}>Translator</Link>
                <Link to="/history" className="nav-link" onClick={closeMobileMenu}>History</Link>
                <div className="user-profile">
                  <div className="user-avatar">{user.username?.charAt(0).toUpperCase()}</div>
                  <span className="user-name">{user.username}</span>
                </div>
                <button onClick={handleLogout} className="btn-logout">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link" onClick={closeMobileMenu}>Login</Link>
                <Link to="/signup" className="btn-signup" onClick={closeMobileMenu}>Sign Up</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/app" element={<RequireAuth><TranslatorPage /></RequireAuth>} />
        <Route path="/history" element={<RequireAuth><HistoryPage /></RequireAuth>} />
      </Routes>
    </>
  );
}

export default App;
