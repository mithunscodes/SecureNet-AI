import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './ForgotPassword.css';

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: New Password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  const apiUrl = 'http://localhost:5000';

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${apiUrl}/api/auth/forgot-password`, { email });
      
      if (response.data.success) {
        setSuccess('Verification code sent to your email!');
        setStep(2);
        startTimer(60); // Start 60 second cooldown
      } else {
        setError(response.data.error || 'Failed to send code');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${apiUrl}/api/auth/verify-code`, { email, code });
      
      if (response.data.success) {
        setResetToken(response.data.reset_token);
        setSuccess('Code verified! Please enter your new password.');
        setStep(3);
      } else {
        setError(response.data.error || 'Invalid verification code');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
    }

    setLoading(true);
    setError('');

    try {
        const response = await axios.post(`${apiUrl}/api/forgot_password`, {
        email,
        new_password: newPassword
        });

        if (response.data.success) {
        setSuccess('Password reset successful!');
        setTimeout(() => navigate('/signin'), 2000);
        } else {
        setError('Failed to reset password');
        }
    } catch (err) {
        setError('Error resetting password');
    } finally {
        setLoading(false);
    }
    };

  const startTimer = (seconds) => {
    setTimer(seconds);
    setCanResend(false);
    
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${apiUrl}/api/auth/forgot-password`, { email });
      
      if (response.data.success) {
        setSuccess('New verification code sent!');
        startTimer(60);
      } else {
        setError(response.data.error || 'Failed to send code');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="cyber-grid"></div>
      
      <nav className="forgot-nav">
        <div className="nav-container">
          <div className="logo" onClick={() => navigate('/')}>SecureNet AI</div>
          <button className="back-btn" onClick={() => navigate('/signin')}>
            ← Back to Sign In
          </button>
        </div>
      </nav>

      <div className="forgot-card">
        <div className="forgot-header">
          <h2>
            {step === 1 && 'Forgot Password?'}
            {step === 2 && 'Enter Verification Code'}
            {step === 3 && 'Create New Password'}
          </h2>
          <p>
            {step === 1 && 'Enter your email address and we\'ll send you a verification code'}
            {step === 2 && `We've sent a 6-digit code to ${email}`}
            {step === 3 && 'Enter your new password below'}
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {step === 1 && (
          <form onSubmit={handleSendCode} className="forgot-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="send-code-btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="forgot-form">
            <div className="form-group">
              <label>Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength="6"
                required
                disabled={loading}
                className="code-input"
              />
              <div className="code-help">
                <span>Enter the 6-digit code sent to your email</span>
                {timer > 0 && (
                  <span className="timer">Resend available in {timer}s</span>
                )}
                {canResend && (
                  <button 
                    type="button" 
                    className="resend-link"
                    onClick={handleResendCode}
                    disabled={loading}
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </div>
            <button type="submit" className="verify-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="forgot-form">
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="reset-btn" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="forgot-footer">
          <p>
            <Link to="/signin">← Back to Sign In</Link>
          </p>
        </div>

        <div className="security-note">
          <div className="note-icon">🔒</div>
          <div className="note-text">
            <strong>Security Note:</strong> Your password reset code expires in 10 minutes.
            If you don't receive the email, check your spam folder.
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;