// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import '../styles/Profile.css';

export default function Profile() {
  const { user, token, fetchUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(
    user?.profileImage
      ? `${API_BASE_URL}${user.profileImage}`
      : 'https://via.placeholder.com/160x160/64748B/FFFFFF?text=No+Image'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Upload image first if changed
      if (image) {
        const formData = new FormData();
        formData.append('profileImage', image);

        await axios.put(`${API_BASE_URL}/api/user/profile/image`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      // Update text fields
      await axios.put(`${API_BASE_URL}/api/user/profile`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      await fetchUser(); // Refresh user data
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Profile update failed:', err);
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-container text-center p-8">
        <p className="text-xl text-secondary">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="profile-image-wrapper">
          <img src={preview} alt="Profile" className="profile-image" />
          <label className="upload-btn">
            Change Photo
            <input type="file" accept="image/*" onChange={handleImageChange} />
          </label>
        </div>

        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Email (Locked)</label>
          <input type="email" value={user.email} disabled className="opacity-60" />
        </div>

        {!user.phone ? (
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
          </div>
        ) : (
          <div className="form-group">
            <label>Phone (Locked)</label>
            <input type="tel" value={user.phone} disabled className="opacity-60" />
          </div>
        )}

        <div className="form-group">
          <label>Address</label>
          <textarea
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
            rows="3"
          />
        </div>

        <button type="submit" disabled={isSubmitting} className="save-btn">
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
