// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Profile.css';

export default function Profile() {
  const { user, token, fetchUser } = useAuth();
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  if (!user) {
    return (
      <div className="profile-container text-center p-8">
        <p className="text-xl text-secondary">Loading profile...</p>
      </div>
    );
  }

  const [form, setForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    address: user.address || ''
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(
    user.profileImage ? `https://your-backend.onrender.com${user.profileImage}` : '/default-avatar.png'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

// src/pages/Profile.jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  if (isSubmitting) return;
  setIsSubmitting(true);

  try {
    // 1. Upload image (FormData)
    if (image) {
      const formData = new FormData();
      formData.append('profileImage', image);

      await axios.put('/api/user/profile/image', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
    }

    // 2. Update profile (JSON)
    await axios.put('/api/user/profile', form, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json' // ← CRITICAL
      }
    });

    await fetchUser();
    alert('Profile updated successfully!');
  } catch (err) {
    console.error('Profile save error:', err);
    alert(err.response?.data?.message || 'Failed to save profile');
  } finally {
    setIsSubmitting(false);
  }
};

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
          />
        </div>

        <button type="submit" disabled={isSubmitting} className="save-btn">
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}