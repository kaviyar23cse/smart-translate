import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LoginPage.css'; // Import the new CSS file
import '../App.css'; // Common styles
import AuthContext from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const toast = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
  toast.success('Welcome back!');
  navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed.');
  toast.error(err.message || 'Login failed.');
    }
  };
  return (
    <div className="page login-page-container">
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
