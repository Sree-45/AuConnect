import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react'; // Add this import for icons
import './cssFiles/Register.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username.toLowerCase(),
          password: formData.password
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Save user data
        localStorage.setItem('username', formData.username.toLowerCase());
        
        // Redirect to feed page
        navigate('/');
      } else {
        setErrors({ auth: data.message || 'Invalid username or password' });
      }
      
      if (response.ok) {
        // Store username in localStorage
        localStorage.setItem('username', formData.username);
        // Redirect to feed page
        navigate('/feed');
      }
    } catch (error) {
      setErrors({ auth: 'An error occurred. Please try again.' });
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="form-container">
          <div className="form-header">
            <h2>Log In</h2>
            <p className="form-subtitle">Welcome back! Please log in to your account</p>
          </div>
          
          <form onSubmit={handleSubmit}>
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
            </div>
            
            {errors.auth && <div className="error-message general-error">{errors.auth}</div>}
            
            <div className="input-info" style={{ textAlign: 'center' }}>
              Only accounts with @anurag.edu.in email addresses can access this system.
            </div>
            
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="button-content">
                  <span className="spinner"></span> Logging In...
                </span>
              ) : (
                <span className="button-content">Log In</span>
              )}
            </button>
          </form>
          
          <p className="login-link">
            Don't have an account? <Link to="/register" className="accent-link">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
