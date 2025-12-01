// src/pages/Investments.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import '../styles/Investment.css';

export default function Investments() {
  const [plans, setPlans] = useState([]);
  const [userInvestments, setUserInvestments] = useState([]);
  const [userBalance, setUserBalance] = useState({ checking: 0, savings: 0, usdt: 0 });
  const { token } = useAuth();
  const navigate = useNavigate();

  const totalInvested = userInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalProfit = userInvestments.reduce((sum, inv) => sum + (inv.amount * inv.rate), 0);
  const totalAvailable = Object.values(userBalance).reduce((a, b) => a + b, 0);

  useEffect(() => {
    // Fetch plans
    axios.get(`${API_BASE_URL}/api/investments/plans`)
      .then(res => setPlans(Array.isArray(res.data) ? res.data : []))
      .catch(() => setPlans([]));

    // Fetch user data
    if (token) {
      axios.get(`${API_BASE_URL}/api/user`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          setUserInvestments(res.data.investments || []);
          setUserBalance(res.data.balance || { checking: 0, savings: 0, usdt: 0 });
        })
        .catch(() => setUserInvestments([]));
    }
  }, [token]);

  const handleInvest = (plan) => {
    navigate('/invest', { state: { plan } });
  };

  return (
    <div className="investments-modern">
      <div className="investments-wrapper">

        {/* Hero + Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-balance-card glass-card"
        >
          <div className="balance-header">
            <h1>Grow with Kirt</h1>
            <p>Earn up to <span className="highlight">28% ROI</span> on fixed-term plans</p>
          </div>

          <div className="balance-grid">
            <div className="balance-item">
              <p>Total Invested</p>
              <h2>${totalInvested.toLocaleString()}</h2>
            </div>
            <div className="balance-item profit">
              <p>Expected Profit</p>
              <h2>+${totalProfit.toFixed(0)}</h2>
            </div>
            <div className="balance-item">
              <p>Available Balance</p>
              <h2>${totalAvailable.toLocaleString()}</h2>
            </div>
          </div>
        </motion.div>

        {/* Investment Plans */}
        <section className="plans-section">
          <h2 className="section-heading">Choose Your Plan</h2>
          <div className="plans-grid">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                className="plan-card glass-card"
                onClick={() => handleInvest(plan)}
              >
                <div className="plan-badge">POPULAR</div>
                <div className="plan-roi-circle">
                  <svg viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="#e5e7eb" strokeWidth="3"/>
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="url(#gold-gradient)" strokeWidth="3"
                      strokeDasharray={`${plan.rate * 100}, 100`} />
                    <text x="18" y="20.35" className="percentage">{(plan.rate * 100).toFixed(0)}%</text>
                  </svg>
                  <p>ROI</p>
                </div>

                <h3>{plan.name}</h3>
                <p className="term">{plan.term}</p>
                <p className="range">${plan.min.toLocaleString()} - ${plan.max.toLocaleString()}</p>

                <button className="invest-btn-modern">
                  Invest Now
                  <span className="arrow">→</span>
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Active Investments */}
        {userInvestments.length > 0 && (
          <section className="active-investments">
            <h2 className="section-heading">Active Investments</h2>
            <div className="investments-timeline">
              {userInvestments.map((inv, i) => {
                const daysLeft = differenceInDays(new Date(inv.maturityDate), new Date());
                const progress = ((inv.termDays - daysLeft) / inv.termDays) * 100;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="timeline-card glass-card"
                  >
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div className="inv-header">
                        <h4>{inv.plan.toUpperCase()} PLAN</h4>
                        <span className="status active">Active</span>
                      </div>

                      <div className="progress-container">
                        <div className="progress-bar" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="days-left">{daysLeft > 0 ? `${daysLeft} days left` : 'Matured'}</p>

                      <div className="inv-details">
                        <div>
                          <p>Principal</p>
                          <h5>${inv.amount.toLocaleString()}</h5>
                        </div>
                        <div>
                          <p>Profit</p>
                          <h5 className="profit">+${(inv.amount * inv.rate).toFixed(0)}</h5>
                        </div>
                        <div>
                          <p>Maturity</p>
                          <h5>{format(new Date(inv.maturityDate), 'MMM dd, yyyy')}</h5>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Floating Action Button */}
        <motion.button
          className="fab glass"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => document.querySelector('.plans-section')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </motion.button>
      </div>
    </div>
  );
}