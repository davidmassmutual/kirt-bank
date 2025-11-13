// src/pages/Investments.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/Investment.css';

export default function Investments() {
  const [plans, setPlans] = useState([]);
  const [userInvestments, setUserInvestments] = useState([]);
  const { token } = useAuth();
  const navigate = useNavigate();

  const totalInvested = userInvestments.reduce((sum, inv) => sum + inv.amount, 0);

  const [userBalance, setUserBalance] = useState({ checking: 0, savings: 0, usdt: 0 });

 // src/pages/Investments.jsx
useEffect(() => {
  axios.get('/api/investments/plans')
    .then(res => {
      if (Array.isArray(res.data)) {
        setPlans(res.data);
      } else {
        console.error('Plans is not array:', res.data);
        setPlans([]);
      }
    })
    .catch(err => {
      console.error('Plans error:', err);
      setPlans([]);
    });

    // Fetch user investments
    if (token) {
      axios.get('/api/user', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          if (Array.isArray(res.data.investments)) {
            setUserInvestments(res.data.investments);
          }
        })
        .catch(() => setUserInvestments([]));
    }
  }, [token]); 
  const handleInvest = (plan) => {
    navigate('/invest', { state: { plan } });
  };

useEffect(() => {
  if (token) {
    axios.get('/api/user', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setUserInvestments(res.data.investments || []);
        setUserBalance(res.data.balance || { checking: 0, savings: 0, usdt: 0 });
      })
      .catch(() => {});
  }
}, [token]);

  return (
    <div className="investments-page">
      <div className="investments-container">
        {/* HERO */}
        <div className="hero-section">
          <h1 className="hero-title">Grow Your Wealth</h1>
          <p className="hero-subtitle">Earn up to 28% ROI with secure, fixed-term investments</p>
        </div>

        {/* TOTAL INVESTED */}
        {userInvestments.length > 0 && (
          <div className="total-card">
            <p className="total-label">Total Invested</p>
            <p className="total-amount">${totalInvested.toLocaleString()}</p>
            <p className="total-count">{userInvestments.length} active plan{userInvestments.length > 1 ? 's' : ''}</p>
          </div>
        )}

        {userInvestments.length > 0 && (
  <div className="mt-6 p-6 bg-card/80 backdrop-blur rounded-2xl border border-gold/30 text-center">
    <p className="text-sm text-secondary mb-1">Total Invested</p>
    <p className="text-3xl font-bold text-gold">${totalInvested.toLocaleString()}</p>
    <p className="text-xs text-secondary mt-1">{userInvestments.length} active plan{userInvestments.length > 1 ? 's' : ''}</p>
    <p className="text-xs text-secondary mt-2">Available: ${Object.values(userBalance).reduce((s, v) => s + v, 0).toLocaleString()}</p>
  </div>
)}

        {/* PLANS */}
        <div className="plans-section">
          <h2 className="section-title">Investment Plans</h2>
          <div className="plans-grid">
            {plans.length === 0 ? (
              <p className="loading-text">Loading plans...</p>
            ) : (
              plans.map(plan => (
                <div key={plan.name} className="plan-card">
                  <div className="plan-header">
                    <h3 className="plan-name">{plan.name}</h3>
                    <div className="plan-roi">{(plan.rate * 100).toFixed(0)}%</div>
                  </div>
                  <div className="plan-details">
                    <p className="plan-term">{plan.term}</p>
                    <p className="plan-range">${plan.min.toLocaleString()} – ${plan.max.toLocaleString()}</p>
                  </div>
                  <button onClick={() => handleInvest(plan)} className="invest-btn">
                    Invest Now
                    <svg className="btn-arrow" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ACTIVE INVESTMENTS */}
        {userInvestments.length > 0 && (
          <div className="active-section">
            <h2 className="section-title">Your Active Investments</h2>
            <div className="investments-list">
              {userInvestments.map((inv, i) => {
                const profit = (inv.amount * inv.rate).toFixed(2);
                const maturity = new Date(inv.maturityDate).toLocaleDateString();
                return (
                  <div key={i} className="investment-item">
                    <div className="inv-info">
                      <h4 className="inv-plan">{inv.plan.toUpperCase()} PLAN</h4>
                      <p className="inv-date">Matures {maturity}</p>
                    </div>
                    <div className="inv-amounts">
                      <p className="inv-principal">${inv.amount.toLocaleString()}</p>
                      <p className="inv-profit">+${profit}</p>
                    </div>
                    <div className="inv-status">Active</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}