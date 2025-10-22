// src/pages/NotificationsPage.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../styles/NotificationsPage.css';

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Replace with actual API call
        const sampleNotifications = [
          { id: 1, message: 'Deposit Pending', timestamp: '2025-10-17 10:00 AM', status: 'Unread', type: 'deposit' },
          { id: 2, message: 'Transfer Successful', timestamp: '2025-10-16 3:45 PM', status: 'Read', type: 'transfer' },
          { id: 3, message: 'Low Balance Warning', timestamp: '2025-10-15 9:20 AM', status: 'Unread', type: 'alert' },
          { id: 4, message: 'Loan Application Approved', timestamp: '2025-10-14 1:30 PM', status: 'Read', type: 'loan' },
        ];
        setNotifications(sampleNotifications);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch notifications');
        setLoading(false);
        toast.error(err.message || 'Failed to fetch notifications');
      }
    };
    fetchNotifications();
  }, []);

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter((n) => n.type === filter);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="notifications-page">
      <h2><i className="fas fa-bell"></i> Notifications</h2>
      <div className="filter-bar">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={filter === 'deposit' ? 'active' : ''}
          onClick={() => setFilter('deposit')}
        >
          Deposits
        </button>
        <button
          className={filter === 'transfer' ? 'active' : ''}
          onClick={() => setFilter('transfer')}
        >
          Transfers
        </button>
        <button
          className={filter === 'alert' ? 'active' : ''}
          onClick={() => setFilter('alert')}
        >
          Alerts
        </button>
        <button
          className={filter === 'loan' ? 'active' : ''}
          onClick={() => setFilter('loan')}
        >
          Loans
        </button>
      </div>
      <div className="notification-list">
        {filteredNotifications.length === 0 ? (
          <p className="no-notifications">No notifications available.</p>
        ) : (
          filteredNotifications.map((notification) => (
            <div key={notification.id} className="notification-card">
              <div className="notification-icon">
                <i className={`fas fa-${
                  notification.type === 'deposit' ? 'money-check-alt' :
                  notification.type === 'transfer' ? 'exchange-alt' :
                  notification.type === 'alert' ? 'exclamation-circle' :
                  'hand-holding-usd'
                }`}></i>
              </div>
              <div className="notification-content">
                <p>{notification.message}</p>
                <span>{notification.timestamp}</span>
                <span className={`status ${notification.status.toLowerCase()}`}>
                  {notification.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      <Link to="/dashboard" className="back-button">Back to Dashboard</Link>
    </div>
  );
}

export default NotificationsPage;