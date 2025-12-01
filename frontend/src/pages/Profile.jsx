// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import '../styles/Profile.css';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaShieldAlt } from 'react-icons/fa';

export default function Profile() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/');
    }
  }, [token, navigate]);

  if (!user) {
    return (
      <div className="profile-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  // Split name into first and last name
  const nameParts = user.name?.split(' ') || [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p>View your account information and profile details</p>
      </div>

      <div className="profile-content">
        {/* Profile Image Section */}
        <div className="profile-image-section">
          {user.profileImage ? (
            <img
              src={`${API_BASE_URL}${user.profileImage}`}
              alt="Profile"
              className="profile-display-image"
            />
          ) : (
            <div className="profile-image-placeholder">
              <FaUser />
            </div>
          )}
        </div>

        {/* Profile Information */}
        <div className="profile-info-grid">
          <div className="info-card">
            <div className="info-header">
              <FaUser className="info-icon" />
              <h3>Personal Information</h3>
            </div>
            <div className="info-content">
              <div className="info-row">
                <span className="info-label">First Name:</span>
                <span className="info-value">{firstName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Last Name:</span>
                <span className="info-value">{lastName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{user.email}</span>
              </div>
              {user.phone && (
                <div className="info-row">
                  <span className="info-label">Phone:</span>
                  <span className="info-value">{user.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="info-card">
            <div className="info-header">
              <FaMapMarkerAlt className="info-icon" />
              <h3>Address Information</h3>
            </div>
            <div className="info-content">
              <div className="info-row">
                <span className="info-label">Address:</span>
                <span className="info-value">{user.address || 'Not provided'}</span>
              </div>
            </div>
          </div>

          <div className="info-card">
            <div className="info-header">
              <FaCalendarAlt className="info-icon" />
              <h3>Account Information</h3>
            </div>
            <div className="info-content">
              <div className="info-row">
                <span className="info-label">Member Since:</span>
                <span className="info-value">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Account Status:</span>
                <span className="info-value status-active">Active</span>
              </div>
              <div className="info-row">
                <span className="info-label">KYC Status:</span>
                <span className={`info-value status-${user.kycStatus || 'pending'}`}>
                  {user.kycStatus === 'verified' ? 'Verified' :
                   user.kycStatus === 'submitted' ? 'Under Review' : 'Not Submitted'}
                </span>
              </div>
            </div>
          </div>

          <div className="info-card">
            <div className="info-header">
              <FaShieldAlt className="info-icon" />
              <h3>Security Information</h3>
            </div>
            <div className="info-content">
              <div className="info-row">
                <span className="info-label">Two-Factor Auth:</span>
                <span className={`info-value ${user.twoFactorEnabled ? 'status-enabled' : 'status-disabled'}`}>
                  {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Last Login:</span>
                <span className="info-value">Recent</span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Balance Summary */}
        <div className="balance-summary">
          <h3>Account Balance</h3>
          <div className="balance-grid">
            <div className="balance-item">
              <span className="balance-label">Checking:</span>
              <span className="balance-amount">${user.balance?.checking?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="balance-item">
              <span className="balance-label">Savings:</span>
              <span className="balance-amount">${user.balance?.savings?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="balance-item">
              <span className="balance-label">USDT:</span>
              <span className="balance-amount">${user.balance?.usdt?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        {/* Edit Profile Button */}
        <div className="profile-actions">
          <button
            onClick={() => navigate('/settings')}
            className="edit-profile-btn"
          >
            Edit Profile Information
          </button>
        </div>
      </div>
    </div>
  );
}
