// src/pages/Investments.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/Investment.css';

export default function Investments() {
  const [plans, setPlans] = useState([]);
  const [userInvestments, setUserInvestments] = useState([]);
  const { user, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch plans
    axios.get('/api/investments/plans')
      .then(res => {
        const data = res.data;
        if (Array.isArray(data)) {
          setPlans(data);
        } else {
          console.error('Plans is not array:', data);
          setPlans([]);
        }
      })
      .catch(err => {
        console.error('Plans fetch error:', err);
        setPlans([]);
      });

    // Fetch user investments
    if (token) {
      axios.get('/api/user', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          const investments = res.data.investments;
          if (Array.isArray(investments)) {
            setUserInvestments(investments);
          } else {
            setUserInvestments([]);
          }
        })
        .catch(() => setUserInvestments([]));
    }
  }, [token]);

  const handleInvest = (plan) => {
    navigate('/invest', { state: { plan } });
  };

  const totalInvested = userInvestments.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  return (
    <div className="investments-container">
      <div className="investments-header">
        <h1>Investment Plans</h1>
        <p>Grow your wealth with guaranteed returns.</p>

        {userInvestments.length > 0 && (
          <div className="mt-6 p-6 bg-card/80 backdrop-blur rounded-2xl border border-gold/30 text-center">
            <p className="text-sm text-secondary mb-1">Total Invested</p>
            <p className="text-3xl font-bold text-gold">${totalInvested.toLocaleString()}</p>
          </div>
        )}
      </div>

      <div className="plans-grid">
        {plans.length === 0 ? (
          <p className="text-center col-span-full text-secondary">Loading plans...</p>
        ) : (
          plans.map(plan => (
            <div key={plan.name} className="plan-card">
              <div className="plan-rate">{(plan.rate * 100).toFixed(0)}%</div>
              <h3 className="plan-name">{plan.name} Plan</h3>
              <p className="plan-term">{plan.term}</p>
              <p className="plan-range">${plan.min.toLocaleString()} – ${plan.max.toLocaleString()}</p>
              <button onClick={() => handleInvest(plan)} className="invest-btn">
                Invest Now
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}