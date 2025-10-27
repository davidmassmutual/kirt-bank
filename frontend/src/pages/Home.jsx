// frontend/src/pages/Home.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/Home.css';
import img1 from '../images/hero2.jpg';
import img2 from '../images/hero1.jpg';
import img3 from '../images/65aa41dfd56eff4889757fcc_customer service in banking_cover image.jpg';
import img4 from '../images/8523a5f867ed9cbc1e1944bf7d2c25b340b6550a.png';
import img5 from '../images/fast.webp';
import img6 from '../images/Mobile-Banking-App-Features.jpg';
import img7 from '../images/support.png';
import img9 from '../images/WhatsApp Image 2025-10-17 at 16.15.27.jpeg';

function Home({ setIsAuthenticated }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear error on input change
  };

  const validateForm = () => {
    if (isSignUp && !formData.name.trim()) {
      setError('Full name is required for registration');
      return false;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('A valid email is required');
      return false;
    }
    if (!formData.password.trim() || formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      toast.error(error);
      return;
    }

    try {
      const url = isSignUp
        ? `${import.meta.env.VITE_API_URL}/api/auth/register`
        : `${import.meta.env.VITE_API_URL}/api/auth/login`;
      const res = await axios.post(url, formData);
      console.log(isSignUp ? 'Register response:' : 'Login response:', res.data);
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        setIsAuthenticated(true);
        navigate('/dashboard');
        toast.success(isSignUp ? 'Registration successful!' : 'Login successful!');
      } else {
        setError('No token received from server');
        toast.error('Authentication failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({ name: '', email: '', password: '' });
    setError('');
  };

  return (
    <div className="home">
      <section className="hero">
        <img src={img5} alt="Banking Hero" className="hero-image" />
        <div className="hero-content">
          <h1>
            Kirt Bank <img src={img9} alt="" className="navbar-brand-image" />
          </h1>
          <h2>Secure Banking, Simplified</h2>
          <p>Join Kirt Bank for seamless, secure, and innovative banking solutions.</p>
          <div className="hero-buttons">
            <button onClick={() => setIsSignUp(true)} className="auth-button signup">
              <i className="fas fa-user-plus"></i> Sign Up
            </button>
            <button onClick={() => setIsSignUp(false)} className="auth-button login">
              <i className="fas fa-sign-in-alt"></i> Login
            </button>
          </div>
        </div>
      </section>
      <section className="auth-section">
        <h2>{isSignUp ? 'Join Us Today' : 'Welcome Back'}</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          {isSignUp && (
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
            disabled={loading}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            required
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            <i className={`fas ${isSignUp ? 'fa-user-plus' : 'fa-sign-in-alt'}`}></i>
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Login'}
          </button>
          <p onClick={toggleAuthMode}>
            {isSignUp ? (
              <>
                Already have an account? <Link to="#" onClick={toggleAuthMode}>Log In</Link>
              </>
            ) : (
              <>
                Don't have an account? <Link to="#" onClick={toggleAuthMode}>Sign Up</Link>
              </>
            )}
          </p>
        </form>
      </section>
      <section className="features-section">
        <h2>Why Choose Kirt Bank?</h2>
        <div className="features">
          <div className="feature-card">
            <img src={img5} alt="Fast Transfers" className="feature-image" />
            <h3>Fast Transfers</h3>
            <p>Send money instantly to anyone, anywhere.</p>
          </div>
          <div className="feature-card">
            <img src={img7} alt="Secure Banking" className="feature-image" />
            <h3>Secure Banking</h3>
            <p>Advanced encryption for your peace of mind.</p>
          </div>
          <div className="feature-card">
            <img src={img3} alt="24/7 Support" className="feature-image" />
            <h3>24/7 Support</h3>
            <p>Our team is here for you anytime.</p>
          </div>
        </div>
      </section>
      <section className="security-section">
        <h2>Your Security, Our Priority</h2>
        <p>Bank with confidence knowing your data is protected with state-of-the-art security measures.</p>
        <img src={img6} alt="Security" className="security-image" />
      </section>
      <section className="reviews-section">
        <h2>Customer Reviews</h2>
        <div className="reviews">
          <div className="review-card">
            <p>"Kirt Bank is reliable and user-friendly!"</p>
            <span>– Jane Doe</span>
          </div>
          <div className="review-card">
            <p>"Best banking app I've used. Highly secure."</p>
            <span>– John Smith</span>
          </div>
          <div className="review-card">
            <p>"Fast and easy transactions every time."</p>
            <span>– Sarah Johnson</span>
          </div>
          <div className="review-card">
            <p>"Excellent support and features!"</p>
            <span>– Michael Brown</span>
          </div>
        </div>
      </section>
      <section className="cta-section">
        <h2>Ready to Start Banking?</h2>
        <button onClick={() => setIsSignUp(true)} className="cta-button">
          Get Started Now
        </button>
      </section>
    </div>
  );
}

export default Home;