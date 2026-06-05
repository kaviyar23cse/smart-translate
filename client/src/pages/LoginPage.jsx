import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LoginPage.css'; // Import the new CSS file
import '../App.css'; // Common styles
import AuthContext from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

// Loading Overlay Component
const LoginLoadingOverlay = ({ isVisible }) => {
    if (!isVisible) return null;
    return (
        <div className="login-loading-overlay">
            <div className="login-loading-content">
                <div className="login-spinner-container">
                    <div className="login-spinner-ring"></div>
                    <div className="login-spinner-ring"></div>
                    <div className="login-spinner-ring"></div>
                    <div className="login-spinner-pulse"></div>
                </div>
                <h3 className="login-loading-title">Signing In</h3>
                <p className="login-loading-subtitle">Verifying your credentials...</p>
                <div className="login-progress-track">
                    <div className="login-progress-bar"></div>
                </div>
            </div>
        </div>
    );
};

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const toast = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed.');
      toast.error(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="page login-page-container">
      <LoginLoadingOverlay isVisible={isLoading} />
      <main className="login-card">
        <h2 className="login-title">Login</h2>
        <form className="form-content login-form" onSubmit={handleLogin}>
          <input type="email" placeholder="Email" className="form-input" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="form-input" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
          <button type="submit" className="btn primary" style={{ width: '100%', marginTop: '10px' }}>Login</button>
        </form>
        {/* <div className="google-btn-container">
          <a href="/auth/google" className="btn accent" style={{ width: '100%', textAlign: 'center' }}>Sign in with Google</a>
        </div> */}
        <div className="row-center">
          <p>Don't have an account? <Link to="/signup" className="link">Sign Up</Link></p>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
