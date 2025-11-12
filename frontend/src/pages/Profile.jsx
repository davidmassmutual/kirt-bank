// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import LoadingSkeleton from '../components/LoadingSkeleton';
import '../styles/Profile.css';
import { FaUser, FaEnvelope, FaPhone, FaHome, FaLock, FaBell, FaGlobe, FaMoon, FaSun } from 'react-icons/fa';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const token = localStorage.getItem('token');
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
        setForm({
          name: res.data.name,
          email: res.data.email,
          phone: res.data.phone || '',
          address: res.data.address || '',
        });
      } catch (err) {
        toast.error('Failed to load profile');
        if (err.response?.status === 401) navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token, API, navigate]);

  const handleSave = async () => {
    try {
      await axios.put(`${API}/api/users/profile`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Profile updated');
      setEditMode(false);
      setUser({ ...user, ...form });
    } catch (err) {
      toast.error('Update failed');
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="avatar"><FaUser size={60} /></div>
        <h1>{user.name}</h1>
        <p>Member since {new Date(user.createdAt).toLocaleDateString()}</p>
      </div>

      <div className="profile-sections">
        <div className="section">
          <h2><FaUser /> Personal Info</h2>
          {editMode ? (
            <div className="edit-form">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" />
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" />
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone" />
              <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Address" />
              <button onClick={handleSave} className="save-btn">Save</button>
              <button onClick={() => setEditMode(false)} className="cancel-btn">Cancel</button>
            </div>
          ) : (
            <div className="info-grid">
              <div><FaEnvelope /> {user.email}</div>
              <div><FaPhone /> {user.phone || 'Not set'}</div>
              <div><FaHome /> {user.address || 'Not set'}</div>
              <button onClick={() => setEditMode(true)} className="edit-btn">Edit</button>
            </div>
          )}
        </div>

        <div className="section">
          <h2><FaLock /> Security</h2>
          <div className="security-item">
            <span>Two-Factor Auth</span>
            <label className="switch">
              <input type="checkbox" checked={user.twoFactorEnabled} readOnly />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="section">
          <h2><FaBell /> Notifications</h2>
          <div className="notif-item">
            <span>Email</span>
            <label className="switch"><input type="checkbox" checked={user.notificationsSettings?.email} readOnly /><span className="slider"></span></label>
          </div>
        </div>

        <div className="section">
          <h2><FaGlobe /> Preferences</h2>
          <div className="pref-item">
            <span>Currency</span>
            <select value={user.currency} readOnly>
              <option>USD</option>
            </select>
          </div>
          <div className="pref-item">
            <span>Theme</span>
            <div className="theme-toggle">
              <FaSun /> <span>{user.theme === 'dark' ? 'Dark' : 'Light'}</span> <FaMoon />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;