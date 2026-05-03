import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './SignUp.css';

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await fetch('http://localhost:5000/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });
        const data = await response.json();

        if (data.success) {
          navigate('/signin');
        } else {
          setErrors({ form: data.message || 'Registration failed' });
        }
      } catch (error) {
        setErrors({ form: 'Could not connect to server. Make sure the backend is running.' });
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="signup-container">
      <div className="cyber-grid"></div>
      
      {/* Navigation */}
      <nav className="signup-nav">
        <div className="nav-container">
          <div className="logo" onClick={() => navigate('/')}>SecureNet AI</div>
          <div className="nav-links">
            <button 
              className="nav-link-btn"
              onClick={() => navigate('/signin')}
            >
              Sign In
            </button>
            <button 
              className="get-started-btn"
              onClick={() => navigate('/signup')}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <div className="signup-wrapper">
        {/* Sign Up Form Section */}
        <div className="signup-form-section">
          <div className="signup-card">
            <div className="signup-header">
              <h2>Create your account</h2>
              <p>Join us to start monitoring your network security</p>
            </div>

            <form onSubmit={handleSubmit} className="signup-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className={errors.password ? 'error' : ''}
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>

              <button type="submit" className="signup-btn">
                Create Account →
              </button>
            </form>

            <div className="signup-footer">
              <p>Already have an account? <Link to="/signin">Sign in</Link></p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="features-section">
          <h3>Join Our Security Platform</h3>
          <p className="features-subtitle">Start protecting your network with AI-powered threat detection</p>

          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon">⚡</div>
              <div className="feature-content">
                <h4>Instant Detection</h4>
                <p>Real-time network threat analysis and classification</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🔔</div>
              <div className="feature-content">
                <h4>Smart Alerts</h4>
                <p>Automatic email notifications for critical security events</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <div className="feature-content">
                <h4>Advanced Analytics</h4>
                <p>Comprehensive attack pattern analysis and reporting</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🛡️</div>
              <div className="feature-content">
                <h4>Secure & Reliable</h4>
                <p>Enterprise-grade security with 99.9% uptime</p>
              </div>
            </div>
          </div>

          <div className="stats-badges">
            <div className="stat-badge">
              <span className="stat-value">Free</span>
              <span className="stat-label">To Start</span>
            </div>
            <div className="stat-badge">
              <span className="stat-value">Fast</span>
              <span className="stat-label">Detection</span>
            </div>
            <div className="stat-badge">
              <span className="stat-value">AI</span>
              <span className="stat-label">Powered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;