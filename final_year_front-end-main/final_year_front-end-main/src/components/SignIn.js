import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './SignIn.css';
// Import your API service
// import api from './api';  // Uncomment and adjust the path

function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false); // Optional: add loading state

  const validateForm = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);

      try {
        const response = await fetch('http://localhost:5000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (data.success) {
          localStorage.setItem('user', email);
          navigate('/dashboard');
        } else {
          setErrors({ form: data.message || 'Invalid credentials' });
        }
      } catch (error) {
        setErrors({ form: 'Could not connect to server. Make sure the backend is running.' });
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="signin-container">
      <div className="cyber-grid"></div>
      
      <nav className="signin-nav">
        <div className="nav-container">
          <div className="logo" onClick={() => navigate('/')}>SecureNet AI</div>
          <button 
            className="back-home-btn"
            onClick={() => navigate('/')}
          >
            ← Back to Home
          </button>
        </div>
      </nav>

      <div className="signin-card">
        <div className="signin-header">
          <h2>Welcome Back</h2>
          <p>Sign in to access your secure dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="signin-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {errors.form && <div className="error-message form-error">{errors.form}</div>}

          <div className="form-options">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="checkbox-text">Remember me</span>
            </label>
            <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
          </div>

          <button type="submit" className="signin-btn" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="signin-footer">
          <p>Don't have an account? <Link to="/signup" className="text-link">Create Account</Link></p>
        </div>

        <div className="demo-credentials">
          <p className="demo-title">Demo Credentials:</p>
          <p>Email: demo@securenet.ai</p>
          <p>Password: demo123</p>
        </div>
      </div>

      <div className="security-badges">
        <div className="badge">
          <span className="badge-icon">🔒</span>
          <span>Enterprise Grade Security</span>
        </div>
        <div className="badge">
          <span className="badge-icon">🛡️</span>
          <span>256-bit Encryption</span>
        </div>
        <div className="badge">
          <span className="badge-icon">⚡</span>
          <span>Real-time Monitoring</span>
        </div>
      </div>
    </div>
  );
}

export default SignIn;