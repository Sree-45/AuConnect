import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './cssFiles/Register.css';

const OTPVerification = ({ userData, onResendOTP, onVerificationComplete }) => {
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp) {
      setError('Please enter the verification code');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:8080/register/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          otp: otp,
          firstName: userData.firstName,
          lastName: userData.lastName,
          username: userData.username,
          password: userData.password
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        onVerificationComplete(true);
      } else {
        setError(data.message || 'Verification failed. Please try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await onResendOTP();
      setTimeLeft(600); // Reset timer to 10 minutes
      setError('');
    } catch (error) {
      setError('Failed to resend verification code. Please try again.');
    }
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>Verify Your Email</h2>
        <p className="form-subtitle">
          We've sent a verification code to {userData.email}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            id="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Verification Code"
            className={error ? 'error' : ''}
            maxLength={6}
          />
          <span className="floating-label">Verification Code</span>
          {error && <span className="error-message">{error}</span>}
        </div>

        <div style={{ textAlign: 'center', margin: '1rem 0' }}>
          <p style={{ fontSize: '0.9rem', color: '#6B7280' }}>
            Time remaining: <span style={{ fontWeight: 'bold' }}>{formatTime(timeLeft)}</span>
          </p>
        </div>

        <button type="submit" className="submit-btn" disabled={isSubmitting || timeLeft === 0}>
          {isSubmitting ? (
            <span className="button-content">
              <span className="spinner"></span> Verifying...
            </span>
          ) : (
            <span className="button-content">Verify</span>
          )}
        </button>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p style={{ fontSize: '0.9rem' }}>
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={handleResendOTP}
              style={{
                background: 'none',
                border: 'none',
                color: '#1E40AF',
                fontWeight: '500',
                cursor: 'pointer',
                padding: 0,
              }}
              disabled={timeLeft > 570} // Disable for first 30 seconds
            >
              Resend Code
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default OTPVerification;