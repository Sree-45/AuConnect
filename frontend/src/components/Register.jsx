import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react'; // Add this import for icons
import OTPVerification from './OTPVerification';
import './cssFiles/register.css';

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    } else if (!formData.email.endsWith('@anurag.edu.in')) {
      newErrors.email = 'Only Anurag University email addresses (@anurag.edu.in) are allowed';
    }
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 4) {
      newErrors.username = 'Username must be at least 4 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else {
      if (!/[A-Z]/.test(formData.password)) {
        newErrors.password = 'Password must include at least one capital letter';
      } else if (!/[0-9]/.test(formData.password)) {
        newErrors.password = 'Password must include at least one number';
      } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(formData.password)) {
        newErrors.password = 'Password must include at least one special character';
      }
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };

  const initiateRegistration = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:8080/register/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          username: formData.username.toLowerCase(), // Convert to lowercase for case-insensitivity
          password: formData.password
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setShowOtpVerification(true);
      } else {
        setErrors({ general: data.message || 'Registration initiation failed' });
      }
    } catch (error) {
      console.error('Error initiating registration:', error);
      setErrors({ general: "Connection error. Please try again later." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validate();
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length === 0) {
      await initiateRegistration();
    }
  };

  const handleVerificationComplete = (success) => {
    if (success) {
      setRegistrationComplete(true);
      setSuccessMessage('Registration successful! Redirecting to login...');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  };

  const handleResendOTP = async () => {
    return initiateRegistration();
  };

  return (
    <div className="registration-container">
      <div className="logo-section">
        <div className="logo-content">
          <h1 className="brand-title">AuConnect.</h1>
          <p className="brand-tagline">Connect. Collaborate. Create.</p>
        </div>
      </div>
      
      <div className="form-section">
        {showOtpVerification ? (
          <OTPVerification 
            userData={formData} 
            onResendOTP={handleResendOTP}
            onVerificationComplete={handleVerificationComplete}
          />
        ) : registrationComplete ? (
          <div className="form-container">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ color: '#10B981', fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
              <h2>Registration Complete!</h2>
              <p>{successMessage}</p>
            </div>
          </div>
        ) : (
          <div className="form-container">
            <div className="form-header">
              <h2>Create an Account</h2>
              <p className="form-subtitle">Join our community today</p>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First Name"
                    className={errors.firstName ? 'error' : ''}
                  />
                  <span className="floating-label">First Name</span>
                  {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                </div>
                
                <div className="form-group">
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last Name"
                    className={errors.lastName ? 'error' : ''}
                  />
                  <span className="floating-label">Last Name</span>
                  {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                </div>
              </div>
              
              <div className="form-group">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className={errors.email ? 'error' : ''}
                />
                <span className="floating-label">Email</span>
                {errors.email && <span className="error-message">{errors.email}</span>}
                <div className="input-info">Only @anurag.edu.in email addresses are accepted</div>
              </div>
              
              <div className="form-group">
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Username"
                  className={errors.username ? 'error' : ''}
                />
                <span className="floating-label">Username</span>
                {errors.username && <span className="error-message">{errors.username}</span>}
              </div>
              
              <div className="form-group">
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className={errors.password ? 'error' : ''}
                  />
                  <span className="floating-label">Password</span>
                  <button 
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}
                <div className="input-info">
                  Minimum 6 characters required, including at least one capital letter, 
                  one number, and one special character
                </div>
              </div>
              
              <div className="form-group">
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm Password"
                    className={errors.confirmPassword ? 'error' : ''}
                  />
                  <span className="floating-label">Confirm Password</span>
                  <button 
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
              
              {errors.general && <div className="error-message general-error">{errors.general}</div>}
              {successMessage && <div className="success-message">{successMessage}</div>}
              
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="button-content">
                    <span className="spinner"></span> Sending Verification...
                  </span>
                ) : (
                  <span className="button-content">Create Account</span>
                )}
              </button>
            </form>
            
            <p className="login-link">
              Already have an account? <Link to="/login" className="accent-link">Log in</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Register;