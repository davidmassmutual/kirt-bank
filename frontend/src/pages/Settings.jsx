import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { QRCodeSVG } from "qrcode.react";
import LoadingSkeleton from '../components/LoadingSkeleton';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBell,
  FaGlobe,
  FaPalette,
  FaShieldAlt,
  FaKey,
  FaDesktop,
  FaSignOutAlt,
  FaSave,
  FaCog
} from 'react-icons/fa';
import '../styles/Settings.css';
import API_BASE_URL from '../config/api';

function Settings() {
  // ────────────────────────────────────── STATE ──────────────────────────────────────
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', address: '' });
  const [security, setSecurity] = useState({
    twoFactor: false,
    newPassword: '',
    confirmPassword: '',
    totpSecret: '',
    totpUrl: '',
  });
  const [notifications, setNotifications] = useState({ email: true, sms: false, push: true });
  const [preferences, setPreferences] = useState({ currency: 'USD', theme: 'light' });
  const [sessions, setSessions] = useState([]);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ────────────────────────────────────── HELPERS ──────────────────────────────────────
  const token = localStorage.getItem('token');

  const fetchSettings = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile({
        name: res.data.name || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        address: res.data.address || '',
      });
      setSecurity(prev => ({ ...prev, twoFactor: res.data.twoFactorEnabled || false }));
      setNotifications(res.data.notificationsSettings || { email: true, sms: false, push: true });
      setPreferences({ currency: res.data.currency || 'USD', theme: res.data.theme || 'light' });

      const sessRes = await axios.get(`${API_BASE_URL}/api/auth/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(sessRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ────────────────────────────────────── EFFECTS ──────────────────────────────────────
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ────────────────────────────────────── HANDLERS ──────────────────────────────────────
  const handleProfileChange = e => setProfile({ ...profile, [e.target.name]: e.target.value });
  const handleSecurityChange = e => setSecurity({ ...security, [e.target.name]: e.target.value });
  const handleNotificationsChange = e =>
    setNotifications({ ...notifications, [e.target.name]: e.target.checked });
  const handlePreferencesChange = e => setPreferences({ ...preferences, [e.target.name]: e.target.value });

  const submitProfile = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`${API_BASE_URL}/api/user/profile`, profile, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const submitPassword = async e => {
    e.preventDefault();
    if (security.newPassword !== security.confirmPassword) return toast.error('Passwords do not match');
    setSubmitting(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/user/password`,
        { password: security.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Password changed');
      setSecurity(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setSubmitting(false);
    }
  };

  const start2FASetup = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/user/2fa/setup`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSecurity(prev => ({ ...prev, totpSecret: res.data.secret, totpUrl: res.data.otpauth_url }));
      setShow2FASetup(true);
      toast.success('Scan QR code with an authenticator app');
    } catch (err) {
      toast.error(err.response?.data?.message || '2FA setup failed');
    } finally {
      setSubmitting(false);
    }
  };

  const verify2FA = async () => {
    if (!/^\d{6}$/.test(totpCode)) return toast.error('Enter a 6‑digit code');
    try {
      await axios.post(
        `${API_BASE_URL}/api/user/2fa/verify`,
        { token: totpCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSecurity(prev => ({ ...prev, twoFactor: true }));
      setShow2FASetup(false);
      setTotpCode('');
      toast.success('2FA enabled');
    } catch (err) {
      toast.error('Invalid code');
    }
  };

  const disable2FA = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/user/2fa/disable`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSecurity(prev => ({ ...prev, twoFactor: false }));
      toast.success('2FA disabled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Disable failed');
    }
  };

  const requestPasswordReset = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email: profile.email });
      toast.success('Password‑reset email sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send email');
    }
  };

  const submitNotifications = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`${API_BASE_URL}/api/user/notifications`, notifications, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Notification preferences saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const submitPreferences = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`${API_BASE_URL}/api/user/preferences`, preferences, {
        headers: { Authorization: `Bearer ${token}` },
      });
      document.documentElement.setAttribute('data-theme', preferences.theme);
      toast.success('Preferences saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const logoutSession = async sessionId => {
    setSubmitting(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/user/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(prev => prev.filter(s => s._id !== sessionId));
      toast.success('Session terminated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Terminate failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ────────────────────────────────────── RENDER ──────────────────────────────────────
  if (loading) return <LoadingSkeleton />;

  return (
    <div className="settings">
      <h2>
        <FaCog /> Settings
      </h2>

      <div className="settings-container">
        {/* ───── PROFILE ───── */}
        <div className="settings-card">
          <h3>
            <FaUser /> Profile Information
          </h3>
          <form onSubmit={submitProfile}>
            <label>
              <FaUser /> Full Name
              <input name="name" value={profile.name} onChange={handleProfileChange} required disabled={submitting} />
            </label>
            <label>
              <FaEnvelope /> Email
              <input name="email" type="email" value={profile.email} onChange={handleProfileChange} required disabled={submitting} />
            </label>
            <label>
              <FaPhone /> Phone
              <input name="phone" type="tel" value={profile.phone} onChange={handleProfileChange} disabled={submitting} />
            </label>
            <label>
              <FaMapMarkerAlt /> Address
              <textarea name="address" rows="3" value={profile.address} onChange={handleProfileChange} disabled={submitting} />
            </label>
            <button type="submit" disabled={submitting}>
              <FaSave /> {submitting ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* ───── SECURITY ───── */}
        <div className="settings-card">
          <h3>
            <FaShieldAlt /> Security
          </h3>

          {/* 2FA */}
          <div className="settings-toggle">
            {security.twoFactor ? (
              <button onClick={disable2FA} disabled={submitting}>
                Disable 2FA
              </button>
            ) : (
              <button onClick={start2FASetup} disabled={submitting}>
                {submitting ? 'Setting up…' : 'Enable 2FA'}
              </button>
            )}
          </div>

     {show2FASetup && (
  <div className="qrcode-section">
    <QRCodeSVG value={security.totpUrl} size={128} />
    <input
      type="text"
      placeholder="6-digit code"
      value={totpCode}
      onChange={e => setTotpCode(e.target.value)}
      maxLength={6}
    />
    <button onClick={verify2FA}>Verify</button>
  </div>
)}

          {/* Password */}
          <form onSubmit={submitPassword}>
            <label>
              <FaKey /> New Password
              <input
                type="password"
                name="newPassword"
                value={security.newPassword}
                onChange={handleSecurityChange}
                required
                disabled={submitting}
              />
            </label>
            <label>
              Confirm Password
              <input
                type="password"
                name="confirmPassword"
                value={security.confirmPassword}
                onChange={handleSecurityChange}
                required
                disabled={submitting}
              />
            </label>
            <button type="submit" disabled={submitting}>
              <FaKey /> {submitting ? 'Changing…' : 'Change Password'}
            </button>
          </form>

          <button onClick={requestPasswordReset} className="reset-link">
            Send Password‑Reset Email
          </button>
        </div>

        {/* ───── NOTIFICATIONS ───── */}
        <div className="settings-card">
          <h3>
            <FaBell /> Notification Preferences
          </h3>
          <form onSubmit={submitNotifications}>
            <label>
              <input
                type="checkbox"
                name="email"
                checked={notifications.email}
                onChange={handleNotificationsChange}
                disabled={submitting}
              />
              Email
            </label>
            <label>
              <input
                type="checkbox"
                name="sms"
                checked={notifications.sms}
                onChange={handleNotificationsChange}
                disabled={submitting}
              />
              SMS
            </label>
            <label>
              <input
                type="checkbox"
                name="push"
                checked={notifications.push}
                onChange={handleNotificationsChange}
                disabled={submitting}
              />
              Push
            </label>
            <button type="submit" disabled={submitting}>
              <FaSave /> {submitting ? 'Saving…' : 'Save'}
            </button>
          </form>
        </div>

        {/* ───── PREFERENCES ───── */}
        <div className="settings-card">
          <h3>
            <FaPalette /> Account Preferences
          </h3>
          <form onSubmit={submitPreferences}>
            <label>
              <FaGlobe /> Currency
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
              <FaSave /> {submitting ? 'Saving…' : 'Save'}
            </button>
          </form>
        </div>

        {/* ───── SESSIONS ───── */}
        <div className="settings-card">
          <h3>
            <FaDesktop /> Active Sessions
          </h3>
          {sessions.length > 0 ? (
            <div className="sessions-list">
              {sessions.map(s => (
                <div key={s._id} className="session-item">
                  <p>{s.device}</p>
                  <span>Last active: {new Date(s.lastActive).toLocaleString()}</span>
                  <button onClick={() => logoutSession(s._id)} disabled={submitting}>
                    <FaSignOutAlt /> Log out
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>No active sessions.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;