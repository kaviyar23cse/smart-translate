import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './SignupPage.css'; // Import the new CSS file
import '../App.css'; // Common styles
import axios from 'axios';
import AuthContext from '../context/AuthContext.jsx';
import API_BASE_URL from '../config.js';
import { useToast } from '../context/ToastContext.jsx';

// Loading Overlay Component
const SignupLoadingOverlay = ({ isVisible }) => {
    if (!isVisible) return null;
    return (
        <div className="signup-loading-overlay">
            <div className="signup-loading-content">
                <div className="signup-spinner-container">
                    <div className="signup-spinner-ring"></div>
                    <div className="signup-spinner-ring"></div>
                    <div className="signup-spinner-ring"></div>
                    <div className="signup-spinner-pulse"></div>
                </div>
                <h3 className="signup-loading-title">Creating Account</h3>
                <p className="signup-loading-subtitle">Setting up your profile...</p>
                <div className="signup-progress-track">
                    <div className="signup-progress-bar"></div>
                </div>
            </div>
        </div>
    );
};

function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const toast = useToast();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/register`, { username, email, password });
      await login(email, password);
      toast.success('Account created! You are now logged in.');
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed.');
      toast.error(err.response?.data?.error || 'Signup failed.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="page signup-page-container">
      <SignupLoadingOverlay isVisible={isLoading} />
      <main className="signup-card">
        <h2 className="signup-title">Sign Up</h2>
        <form className="form-content signup-form" onSubmit={handleSignup}>
          <input type="text" placeholder="Username" className="form-input" value={username} onChange={(e)=>setUsername(e.target.value)} required />
          <input type="email" placeholder="Email" className="form-input" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="form-input" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
          <button type="submit" className="btn accent" style={{ width: '100%', marginTop: '10px' }}>Sign Up</button>
        </form>
        <div className="row-center">
          <p>Already have an account? <Link to="/login" className="link">Login</Link></p>
        </div>
      </main>
    </div>
  );
}

export default SignupPage;
