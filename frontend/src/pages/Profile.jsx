// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Profile.css';

export default function Profile() {
  const { user, token, fetchUser } = useAuth();
  const navigate = useNavigate();

  if (!token) {
    useEffect(() => navigate('/login'), [navigate]);
    return null;
  }

  if (!user) {
    return <div className="profile-container text-center p-8">Loading...</div>;
  }

  const [form, setForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    address: user.address || ''
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(
    user.profileImage ? `https://kirt-bank.vercel.app${user.profileImage}` : '/default-avatar.png'
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

    const formData = new FormData();
    if (image) formData.append('profileImage', image);

    try {
      if (image) {
        await axios.put('/api/user/profile/image', formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      }

      await axios.put('/api/user/profile', form, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await fetchUser();
      alert('Profile updated!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
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
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
          </label>
        </div>

        <div className="form-group">
          <label>Name</label>
          <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
        </div>

        <div className="form-group">
          <label>Email (Locked)</label>
          <input type="email" value={user.email} disabled className="opacity-60 cursor-not-allowed" />
        </div>

        {!user.phone ? (
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
        ) : (
          <div className="form-group">
            <label>Phone (Locked)</label>
            <input type="tel" value={user.phone} disabled className="opacity-60 cursor-not-allowed" />
          </div>
        )}

        <div className="form-group">
          <label>Address</label>
          <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
        </div>

        <button type="submit" disabled={isSubmitting} className="save-btn">
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}