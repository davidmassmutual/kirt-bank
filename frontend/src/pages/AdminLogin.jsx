// frontend/src/pages/AdminLogin.jsx
// frontend/src/pages/AdminLogin.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import '../styles/AdminLogin.css';
import API_BASE_URL from '../config/api';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setToken } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/admin/login`, {
        email,
        password,
      });
      const token = res.data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('isAdmin', 'true');
      setToken(token);
      toast.success('Admin login successful!');
      setTimeout(() => navigate('/admin/dashboard'), 100);
    } catch (err) {
      console.error('Admin login error:', err.response?.status, err.response?.data);
      toast.error(err.response?.data?.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <h2><i className="fas fa-user-shield"></i> Admin Login</h2>
      <div className="login-card">
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={loading}>
            <i className="fas fa-sign-in-alt"></i> {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
