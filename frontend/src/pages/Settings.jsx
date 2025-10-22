// frontend/src/pages/Settings.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/Settings.css';

function Settings() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [security, setSecurity] = useState({
    twoFactor: false,
    newPassword: '',
    confirmPassword: '',
  });
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });
  const [preferences, setPreferences] = useState({
    currency: 'USD',
    theme: 'light',
  });
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile({
          name: res.data.name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          address: res.data.address || '',
        });
        setSecurity({ ...security, twoFactor: res.data.twoFactorEnabled || false });
        setNotifications({
          email: res.data.notifications?.email ?? true,
          sms: res.data.notifications?.sms ?? false,
          push: res.data.notifications?.push ?? true,
        });
        setPreferences({
          currency: res.data.currency || 'USD',
          theme: res.data.theme || 'light',
        });
        const sessionsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSessions(sessionsRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        toast.error(err.message || 'Failed to load settings');
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSecurityChange = (e) => {
    setSecurity({ ...security, [e.target.name]: e.target.value });
  };

  const handleNotificationsChange = (e) => {
    setNotifications({ ...notifications, [e.target.name]: e.target.checked });
  };

  const handlePreferencesChange = (e) => {
    setPreferences({ ...preferences, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/user/profile`,
        profile,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (security.newPassword !== security.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/user/password`,
        { password: security.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Password updated successfully!');
      setSecurity({ ...security, newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    }
  };

  const handle2FASubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/user/2fa`,
        { twoFactor: !security.twoFactor },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSecurity({ ...security, twoFactor: !security.twoFactor });
      toast.success(`Two-Factor Authentication ${security.twoFactor ? 'disabled' : 'enabled'}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update 2FA');
    }
  };

  const handleNotificationsSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/user/notifications`,
        notifications,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Notification preferences updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update notifications');
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/user/preferences`,
        preferences,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      document.documentElement.setAttribute('data-theme', preferences.theme);
      toast.success('Preferences updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update preferences');
    }
  };

  const handleLogoutSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/user/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(sessions.filter((session) => session.id !== sessionId));
      toast.success('Session terminated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to terminate session');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="settings">
      <h2><i className="fas fa-cog"></i> Settings</h2>
      <div className="settings-container">
        <div className="settings-card">
          <h3><i className="fas fa-user"></i> Profile Information</h3>
          <form onSubmit={handleProfileSubmit}>
            <label>
              Full Name
              <input type="text" name="name" value={profile.name} onChange={handleProfileChange} required />
            </label>
            <label>
              Email
              <input type="email" name="email" value={profile.email} onChange={handleProfileChange} required />
            </label>
            <label>
              Phone Number
              <input type="tel" name="phone" value={profile.phone} onChange={handleProfileChange} />
            </label>
            <label>
              Address
              <textarea name="address" value={profile.address} onChange={handleProfileChange} rows="3" />
            </label>
            <button type="submit"><i className="fas fa-save"></i> Save Profile</button>
          </form>
        </div>
        <div className="settings-card">
          <h3><i className="fas fa-shield-alt"></i> Security</h3>
          <div className="settings-toggle">
            <label>
              <i className="fas fa-user-shield"></i>
              <input type="checkbox" checked={security.twoFactor} onChange={handle2FASubmit} />
              Enable Two-Factor Authentication
            </label>
          </div>
          <form onSubmit={handlePasswordSubmit}>
            <label>
              New Password
              <input type="password" name="newPassword" value={security.newPassword} onChange={handleSecurityChange} required />
            </label>
            <label>
              Confirm Password
              <input type="password" name="confirmPassword" value={security.confirmPassword} onChange={handleSecurityChange} required />
            </label>
            <button type="submit"><i className="fas fa-key"></i> Change Password</button>
          </form>
        </div>
        <div className="settings-card">
          <h3><i className="fas fa-bell"></i> Notification Preferences</h3>
          <form onSubmit={handleNotificationsSubmit}>
            <label>
              <input type="checkbox" name="email" checked={notifications.email} onChange={handleNotificationsChange} />
              Email Notifications
            </label>
            <label>
              <input type="checkbox" name="sms" checked={notifications.sms} onChange={handleNotificationsChange} />
              SMS Notifications
            </label>
            <label>
              <input type="checkbox" name="push" checked={notifications.push} onChange={handleNotificationsChange} />
              Push Notifications
            </label>
            <button type="submit"><i className="fas fa-save"></i> Save Notifications</button>
          </form>
        </div>
        <div className="settings-card">
          <h3><i className="fas fa-cogs"></i> Account Preferences</h3>
          <form onSubmit={handlePreferencesSubmit}>
            <label>
              Currency
              <select name="currency" value={preferences.currency} onChange={handlePreferencesChange}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </label>
            <label>
              Theme
              <select name="theme" value={preferences.theme} onChange={handlePreferencesChange}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <button type="submit"><i className="fas fa-save"></i> Save Preferences</button>
          </form>
        </div>
        <div className="settings-card">
          <h3><i className="fas fa-desktop"></i> Active Sessions</h3>
          {sessions.length > 0 ? (
            <div className="sessions-list">
              {sessions.map((session) => (
                <div key={session.id} className="session-item">
                  <p>{session.device}</p>
                  <span>Last Active: {new Date(session.lastActive).toLocaleString()}</span>
                  <button onClick={() => handleLogoutSession(session.id)} className="logout-session">
                    <i className="fas fa-sign-out-alt"></i> Log Out
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>No active sessions found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;