// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import AccountSummary from '../pages/AccountSummary';
import DepositOptions from '../components/DepositOptions';
import TransferPayment from '../pages/TransferPayment';
import CurrencyConverter from '../components/CurrencyConverter';
import LoanBanner from '../components/LoanBanner';
import SecurityDisplay from '../components/SecurityDisplay';
import '../styles/Dashboard.css';
import img9 from '../images/WhatsApp Image 2025-10-17 at 16.15.27.jpeg';

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top on mount
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Token:', token);
        if (!token) {
          throw new Error('No authentication token found');
        }
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('User data:', res.data);
        setUserData(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err.response || err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          toast.error('Session expired. Please log in again.');
          navigate('/');
        } else {
          setError(err.message || 'Failed to fetch user data');
          setLoading(false);
          toast.error(err.message || 'Failed to fetch user data');
        }
      }
    };
    fetchData();
  }, [navigate]);

  const sampleNotifications = [
    { id: 1, message: 'Deposit Pending', timestamp: '2025-10-17 10:00 AM' },
    { id: 2, message: 'Transfer Successful', timestamp: '2025-10-16 3:45 PM' },
    { id: 3, message: 'Low Balance Warning', timestamp: '2025-10-15 9:20 AM' },
  ];

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="dashboard">
      <div className="navbar-brand-mobile">
        <h1>Sterling Trust Bank <img src={img9} alt=""  className='navbar-brand-image'/></h1>
        <p>Strength. Security. Stability.</p>
      </div>
      <div className="notifications-bell">
        <button onClick={toggleNotifications} className="bell-icon">
          <i className="fas fa-bell"></i>
          {sampleNotifications.length > 0 && (
            <span className="badge">{sampleNotifications.length}</span>
          )}
        </button>
        {showNotifications && (
          <div className="notifications-overlay">
            <h3>Notifications</h3>
            {sampleNotifications.slice(0, 3).map((notification) => (
              <div key={notification.id} className="notification-item">
                <p>{notification.message}</p>
                <span>{notification.timestamp}</span>
              </div>
            ))}
            <Link to="/notifications" onClick={() => setShowNotifications(false)} className="view-all">
              View Full Notifications
            </Link>
          </div>
        )}
      </div>
      <div className="welcome-section">
        <h1>
          <span className="welcome-icon">
            <i className="fas fa-user-circle"></i>
          </span>
          Welcome, {userData?.name || 'Lillian'}
        </h1>
      </div>
      <div className="account-sum">
        <AccountSummary accounts={userData?.accounts} />
      </div>
      <div className="action-buttons">
        <div className="action-button-grid">
          <Link to="/deposit-details" className="action-button">
            <i className="fas fa-money-check-alt"></i> Deposit
          </Link>
          <Link to="/loans" className="action-button">
            <i className="fas fa-hand-holding-usd"></i> Loan
          </Link>
          <Link to="/transfer" className="action-button">
            <i className="fas fa-exchange-alt"></i> Transfer
          </Link>
          <Link to="/cards" className="action-button">
            <i className="fas fa-credit-card"></i> Card
          </Link>
        </div>
        <LoanBanner />
      </div>
      <div className="quick-actions">
        <div className="action-card">
          <DepositOptions />
        </div>
        <div className="action-card">
          <TransferPayment />
        </div>
      </div>
      <div className="secondary-features">
        <CurrencyConverter />
        <SecurityDisplay
          lastLogin={userData?.lastLogin ? new Date(userData.lastLogin).toLocaleString() : 'N/A'}
          twoFactorEnabled={userData?.twoFactorEnabled || false}
        />
      </div>
    </div>
  );
}

export default Dashboard;