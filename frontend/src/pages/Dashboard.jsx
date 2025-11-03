import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import AccountSummary from './AccountSummary';
import DepositOptions from '../components/DepositOptions';
import TransferPayment from './TransferPayment';
import CurrencyConverter from '../components/CurrencyConverter';
import LoanBanner from '../components/LoanBanner';
import SecurityDisplay from '../components/SecurityDisplay';
import DepositModal from '../components/DepositModal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import '../styles/Dashboard.css';
import img9 from '../images/WhatsApp Image 2025-10-17 at 16.15.27.jpeg';

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(res.data);
        setLoading(false);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          toast.error('Session expired');
          navigate('/');
        } else {
          toast.error('Failed to load data');
        }
      }
    };
    fetchData();
  }, [navigate]);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="dashboard">
      <div className="navbar-brand-mobile">
        <h1>Kirt Bank <img src={img9} alt="" className="navbar-brand-image" /></h1>
        <p>Strength. Security. Stability.</p>
      </div>
      <div className="notifications-bell">
        <button onClick={() => setShowNotifications(!showNotifications)} className="bell-icon">
          <i className="fas fa-bell"></i>
          {userData?.notifications?.length > 0 && <span className="badge">{userData.notifications.length}</span>}
        </button>
        {showNotifications && (
          <div className="notifications-overlay">
            <h3>Notifications</h3>
            {userData?.notifications?.length > 0 ? (
              userData.notifications.slice(0, 3).map((n, i) => (
                <div key={i} className="notification-item">
                  <p>{n.message}</p>
                  <span>{new Date(n.date).toLocaleString()}</span>
                </div>
              ))
            ) : (
              <p>No notifications.</p>
            )}
            <Link to="/notifications" onClick={() => setShowNotifications(false)}>View All</Link>
          </div>
        )}
      </div>

      {userData?.kycStatus !== 'verified' && (
        <div className="kyc-warning">
          <p>KYC Pending — Upload ID to unlock full features</p>
          <Link to="/loans">Complete KYC</Link>
        </div>
      )}

      <div className="welcome-section">
        <h1>Welcome, {userData?.name || 'User'}</h1>
      </div>
      <div className="account-sum">
        <AccountSummary />
      </div>
      <div className="action-buttons">
        <div className="action-button-grid">
          <button onClick={() => setIsDepositModalOpen(true)} className="action-button">
            Deposit
          </button>
          <Link to="/loans" className="action-button">Loan</Link>
          <Link to="/transfer" className="action-button">Transfer</Link>
          <Link to="/cards" className="action-button">Card</Link>
        </div>
        <LoanBanner />
      </div>
      <div className="quick-actions">
        <div className="action-card"><DepositOptions /></div>
        <div className="action-card"><TransferPayment /></div>
      </div>
      <div className="secondary-features">
        <CurrencyConverter />
        <SecurityDisplay lastLogin={userData?.lastLogin} twoFactorEnabled={userData?.twoFactorEnabled} />
      </div>
      <DepositModal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} />
    </div>
  );
}

export default Dashboard;