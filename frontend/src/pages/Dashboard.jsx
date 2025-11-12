// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import AccountSummary from './AccountSummary';
import LoanBanner from '../components/LoanBanner';
import CurrencyConverter from '../components/CurrencyConverter';
import SecurityDisplay from '../components/SecurityDisplay';
import DepositModal from '../components/DepositModal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import InvestmentCard from '../components/InvestmentCard';
import QuickStats from '../components/QuickStats';
import ActivityFeed from '../components/ActivityFeed';
import img9 from '../images/WhatsApp Image 2025-10-17 at 16.15.27.jpeg';
import { useDeposit } from '../context/DepositContext';
import { FaPlus, FaChartLine, FaExchangeAlt, FaCreditCard, FaBell } from 'react-icons/fa';
import '../styles/Dashboard.css';

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const { openDepositModal, isModalOpen, closeDepositModal } = useDeposit();

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
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          toast.error('Session expired');
          navigate('/');
        } else {
          toast.error('Failed to load data');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="dashboard">
      {/* MOBILE BRAND */}
      <div className="navbar-brand-mobile">
        <h1>Kirt Bank <img src={img9} alt="Kirt Bank" className="brand-logo" /></h1>
        <p>Strength. Security. Stability.</p>
      </div>

      {/* NOTIFICATIONS BELL */}
      <div className="notifications-bell">
        <button onClick={() => setShowNotifications(!showNotifications)} className="bell-icon">
          <FaBell />
          {userData?.notifications?.length > 0 && (
            <span className="notification-badge">{userData.notifications.length}</span>
          )}
        </button>

        {showNotifications && (
          <div className="notifications-panel glass">
            <h3>Notifications</h3>
            {userData.notifications?.length > 0 ? (
              userData.notifications.slice(0, 5).map((n, i) => (
                <div key={i} className="notif-item">
                  <p>{n.message}</p>
                  <span>{new Date(n.date).toLocaleString()}</span>
                </div>
              ))
            ) : (
              <p>No new notifications.</p>
            )}
            <Link to="/notifications" onClick={() => setShowNotifications(false)} className="view-all">
              View All
            </Link>
          </div>
        )}
      </div>

       {/* WELCOME */}
      <div className="welcome-section">
        <h1>Welcome back, {userData?.name?.split(' ')[0] || 'User'}!</h1>
      </div>

      {/* KYC WARNING */}
      {userData?.kycStatus !== 'verified' && (
        <div className="kyc-warning">
          <p>KYC Pending — Upload ID to <Link to="/kyc">Complete KYC</Link> </p>
        </div>
      )}

     

      {/* ACCOUNT SUMMARY */}
      <div className="account-summary-wrapper">
        <AccountSummary />
      </div>

      {/* ACTION BUTTONS – 2×2 MOBILE, 4×1 DESKTOP */}
      <div className="action-grid">
        <button onClick={openDepositModal} className="action-card glass">
          <FaPlus className="icon" />
          <span>Deposit</span>
        </button>
        <Link to="/transfer" className="action-card glass">
          <FaExchangeAlt className="icon" />
          <span>Transfer</span>
        </Link>
        <Link to="/investment" className="action-card glass">
          <FaChartLine className="icon" />
          <span>Invest</span>
        </Link>
        <Link to="/cards" className="action-card glass">
          <FaCreditCard className="icon" />
          <span>Card</span>
        </Link>
      </div>

      {/* LOAN BANNER */}
      <div className="loan-banner-wrapper">
        <LoanBanner />
      </div>
<div className="feature-card glass">
          <InvestmentCard />
        </div>
      {/* QUICK STATS */}
      <div className="quick-stats-wrapper">
        <QuickStats balance={userData?.balance} />
      </div>

      {/* RECENT ACTIVITY */}
      <div className="activity-feed-wrapper">
        <ActivityFeed userId={userData?._id} />
      </div>

      {/* SECONDARY FEATURES */}
      <div className="secondary-features-grid">
        <div className="feature-card glass">
          <CurrencyConverter />
        </div>
        <div className="feature-card glass">
          <SecurityDisplay 
            lastLogin={userData?.lastLogin} 
            twoFactorEnabled={userData?.twoFactorEnabled} 
          />
        </div>
      </div>

      {/* MODAL */}
      <DepositModal isOpen={isModalOpen} onClose={closeDepositModal} />
    </div>
  );
}

export default Dashboard;