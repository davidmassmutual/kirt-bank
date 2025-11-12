import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, token } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(user?.profileImage || '');

  useEffect(() => {
    if (user) setForm({ name: user.name, email: user.email, phone: user.phone || '', address: user.address || '' });
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    if (image) formData.append('profileImage', image);

    try {
      if (image) {
        await axios.put('/api/user/profile/image', formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      }
      await axios.put('/api/user/profile', form, { headers: { Authorization: `Bearer ${token}` } });
      alert('Profile updated!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Profile Settings</h1>

      <div className="bg-card rounded-2xl p-6 mb-6">
        <div className="flex flex-col items-center mb-6">
          <img src={preview || '/default-avatar.png'} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-gold mb-4" />
          <label className="cursor-pointer bg-gold text-black px-6 py-2 rounded-lg font-bold hover:bg-gold-dark transition">
            Change Photo
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" required />
          <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input" required />
          <input type="tel" placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input" />
          <textarea placeholder="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="input h-24" />
          <button type="submit" className="btn-primary w-full">Save Changes</button>
        </form>
      </div>
    </div>
  );
}