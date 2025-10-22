// frontend/src/pages/AccountSummary.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import '../styles/AccountSummary.css';

function AccountSummary() {
  const [balances, setBalances] = useState({
    savingsBalance: 0,
    checkingBalance: 0,
    usdtBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please log in to view account summary');
          navigate('/login');
          return;
        }
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBalances({
          savingsBalance: res.data.savingsBalance || 0,
          checkingBalance: res.data.checkingBalance || 0,
          usdtBalance: res.data.usdtBalance || 0,
        });
        setLoading(false);
      } catch (err) {
        console.error('Fetch balances error:', err.response?.status, err.response?.data);
        if (err.response?.status === 401) {
          toast.error('Session expired, please log in again');
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          toast.error(err.response?.data?.message || 'Failed to load account summary');
        }
        setLoading(false);
      }
    };
    fetchBalances();
  }, [navigate]);

  return (
    <div className="account-summary">
      <h2><i className="fas fa-wallet"></i> Account Summary</h2>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="balance-cards">
          <div className="balance-card">
            <h3>Savings Account</h3>
            <p>${balances.savingsBalance.toLocaleString()}</p>
          </div>
          <div className="balance-card">
            <h3>Checking Account</h3>
            <p>${balances.checkingBalance.toLocaleString()}</p>
          </div>
          <div className="balance-card">
            <h3>USDT (Crypto)</h3>
            <p>${balances.usdtBalance.toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountSummary;