import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/Home.css';
import img1 from "../images/hero2.jpg";
import img2 from "../images/hero1.jpg";
import img3 from "../images/65aa41dfd56eff4889757fcc_customer service in banking_cover image.jpg";
import img4 from "../images/8523a5f867ed9cbc1e1944bf7d2c25b340b6550a.png";
import img5 from "../images/fast.webp";
import img6 from "../images/Mobile-Banking-App-Features.jpg";
import img7 from "../images/support.png";
import img9 from "../images/WhatsApp Image 2025-10-17 at 16.15.27.jpeg";


function Home({ setIsAuthenticated }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isSignUp
        ? `${import.meta.env.VITE_API_URL}/api/auth/register`
        : `${import.meta.env.VITE_API_URL}/api/auth/login`;
      const res = await axios.post(url, formData);
      console.log('Login response:', res.data); // Debug
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        setIsAuthenticated(true);
        navigate('/dashboard');
        toast.success(isSignUp ? 'Registration successful!' : 'Login successful!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred');
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({ name: '', email: '', password: '' });
  };

  return (
    <div className="home">
      <section className="hero">
        <img
          src={img5}
          alt="Banking Hero"
          className="hero-image"
        />
         
        <div className="hero-content">
          <h1>Kirt Bank <img src={img9} alt=""  className='navbar-brand-image'/></h1>
          <h2>Secure Banking, Simplified</h2>
          <p>Join Sterling Trust Bank for seamless, secure, and innovative banking solutions.</p>
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
        <form onSubmit={handleSubmit} className="auth-form">
          {isSignUp && (
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
          <button type="submit">
            <i className={`fas ${isSignUp ? 'fa-user-plus' : 'fa-sign-in-alt'}`}></i>
            {isSignUp ? 'Sign Up' : 'Login'}
          </button>
          <p onClick={toggleAuthMode}>
            {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
          </p>
        </form>
      </section>
      <section className="features-section">
        <h2>Why Choose Sterling Trust?</h2>
        <div className="features">
          <div className="feature-card">
            <img
              src={img5}
              alt="Fast Transfers"
              className="feature-image"
            />
            <h3>Fast Transfers</h3>
            <p>Send money instantly to anyone, anywhere.</p>
          </div>
          <div className="feature-card">
            <img
              src={img7}
              alt="Secure Banking"
              className="feature-image"
            />
            <h3>Secure Banking</h3>
            <p>Advanced encryption for your peace of mind.</p>
          </div>
          <div className="feature-card">
            <img
              src={img3}
              alt="24/7 Support"
              className="feature-image"
            />
            <h3>24/7 Support</h3>
            <p>Our team is here for you anytime.</p>
          </div>
        </div>
      </section>
      <section className="security-section">
        <h2>Your Security, Our Priority</h2>
        <p>Bank with confidence knowing your data is protected with state-of-the-art security measures.</p>
        <img
          src={img6}
          alt="Security"
          className="security-image"
        />
      </section>
      <section className="reviews-section">
        <h2>Customer Reviews</h2>
        <div className="reviews">
          <div className="review-card">
            <p>"Sterling Trust is reliable and user-friendly!"</p>
            <span>– Jane Doe</span>
          </div>
          <div className="review-card">
            <p>"Best banking app I've used. Highly secure."</p>
            <span>– John Smith</span>
          </div>
          <div className="review-card">
            <p>"Best banking app I've used. Highly secure."</p>
            <span>– John Smith</span>
          </div>
          <div className="review-card">
            <p>"Best banking app I've used. Highly secure."</p>
            <span>– John Smith</span>
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