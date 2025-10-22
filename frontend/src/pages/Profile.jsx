import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/Profile.css';
import { FaUserEdit } from 'react-icons/fa';

function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(res.data);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch profile');
        setLoading(false);
        toast.error(err.message || 'Failed to fetch profile');
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <main className="dashboard-content">
      <h1>Profile</h1>
      <div className="profile-card">
        <FaUserEdit className="profile-icon" />
        <p><strong>Name:</strong> {userData?.name || 'N/A'}</p>
        <p><strong>Email:</strong> {userData?.email || 'N/A'}</p>
        <p><strong>Joined:</strong> {new Date(userData?.createdAt).toLocaleDateString() || 'N/A'}</p>
      </div>
    </main>
  );
}

export default Profile;