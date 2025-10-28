// src/pages/NotificationsPage.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(res.data);
      } catch (err) {
        if (err.response?.status === 401) navigate('/login');
        else toast.error('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [navigate]);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL}/api/notifications/read/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="notifications-page">
      <h2>Notifications</h2>
      {notifications.length === 0 ? (
        <p>No notifications.</p>
      ) : (
        <div className="list">
          {notifications.map(notif => (
            <div
              key={notif._id}
              className={`notification ${notif.read ? 'read' : 'unread'}`}
              onClick={() => !notif.read && markAsRead(notif._id)}
            >
              <p>{notif.message}</p>
              <span>{new Date(notif.date).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;