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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
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
          email: res.data.notificationsSettings?.email ?? true,
          sms: res.data.notificationsSettings?.sms ?? false,
          push: res.data.notificationsSettings?.push ?? true,
        });
        setPreferences({
          currency: res.data.currency || 'USD',
          theme: res.data.theme || 'light',
        });
        const sessionsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/sessions`, {
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
    setSubmitting(true);
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
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    if (security.newPassword !== security.confirmPassword) {
      toast.error('Passwords do not match');
      setSubmitting(false);
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
    } finally {
      setSubmitting(false);
    }
  };

  const handle2FASubmit = async () => {
    setSubmitting(true);
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleNotificationsSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
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
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogoutSession = async (sessionId) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/user/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(sessions.filter((session) => session._id !== sessionId));
      toast.success('Session terminated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to terminate session');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-message">Processing your request...</p>
      </div>
    );
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
              <input type="text" name="name" value={profile.name} onChange={handleProfileChange} required disabled={submitting} />
            </label>
            <label>
              Email
              <input type="email" name="email" value={profile.email} onChange={handleProfileChange} required disabled={submitting} />
            </label>
            <label>
              Phone Number
              <input type="tel" name="phone" value={profile.phone} onChange={handleProfileChange} disabled={submitting} />
            </label>
            <label>
              Address
              <textarea name="address" value={profile.address} onChange={handleProfileChange} rows="3" disabled={submitting} />
            </label>
            <button type="submit" disabled={submitting}>
              <i className="fas fa-save"></i> {submitting ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
        <div className="settings-card">
          <h3><i className="fas fa-shield-alt"></i> Security</h3>
          <div className="settings-toggle">
            <label>
              <i className="fas fa-user-shield"></i>
              <input type="checkbox" checked={security.twoFactor} onChange={handle2FASubmit} disabled={submitting} />
              Enable Two-Factor Authentication
            </label>
          </div>
          <form onSubmit={handlePasswordSubmit}>
            <label>
              New Password
              <input type="password" name="newPassword" value={security.newPassword} onChange={handleSecurityChange} required disabled={submitting} />
            </label>
            <label>
              Confirm Password
              <input type="password" name="confirmPassword" value={security.confirmPassword} onChange={handleSecurityChange} required disabled={submitting} />
            </label>
            <button type="submit" disabled={submitting}>
              <i className="fas fa-key"></i> {submitting ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
        <div className="settings-card">
          <h3><i className="fas fa-bell"></i> Notification Preferences</h3>
          <form onSubmit={handleNotificationsSubmit}>
            <label>
              <input type="checkbox" name="email" checked={notifications.email} onChange={handleNotificationsChange} disabled={submitting} />
              Email Notifications
            </label>
            <label>
              <input type="checkbox" name="sms" checked={notifications.sms} onChange={handleNotificationsChange} disabled={submitting} />
              SMS Notifications
            </label>
            <label>
              <input type="checkbox" name="push" checked={notifications.push} onChange={handleNotificationsChange} disabled={submitting} />
              Push Notifications
            </label>
            <button type="submit" disabled={submitting}>
              <i className="fas fa-save"></i> {submitting ? 'Saving...' : 'Save Notifications'}
            </button>
          </form>
        </div>
        <div className="settings-card">
          <h3><i className="fas fa-cogs"></i> Account Preferences</h3>
          <form onSubmit={handlePreferencesSubmit}>
            <label>
              Currency
              <select name="currency" value={preferences.currency} onChange={handlePreferencesChange} disabled={submitting}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </label>
            <label>
              Theme
              <select name="theme" value={preferences.theme} onChange={handlePreferencesChange} disabled={submitting}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <button type="submit" disabled={submitting}>
              <i className="fas fa-save"></i> {submitting ? 'Saving...' : 'Save Preferences'}
            </button>
          </form>
        </div>
        <div className="settings-card">
          <h3><i className="fas fa-desktop"></i> Active Sessions</h3>
          {sessions.length > 0 ? (
            <div className="sessions-list">
              {sessions.map((session) => (
                <div key={session._id} className="session-item">
                  <p>{session.device}</p>
                  <span>Last Active: {new Date(session.lastActive).toLocaleString()}</span>
                  <button onClick={() => handleLogoutSession(session._id)} className="logout-session" disabled={submitting}>
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