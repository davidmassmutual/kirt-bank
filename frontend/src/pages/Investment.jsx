import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Investment.css';

export default function Investments() {
  const [plans, setPlans] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/investments/plans').then(res => setPlans(res.data));
  }, []);

  const handleInvest = (plan) => {
    navigate('/invest', { state: { plan } });
  };

  return (
    <div className="investments-container">
      <div className="investments-header">
        <h1>Investment Plans</h1>
        <p>Grow your wealth with guaranteed returns. Choose a plan and start earning up to <strong>28% ROI</strong>.</p>
      </div>

      <div className="plans-grid">
        {plans.map(plan => (
          <div key={plan.name} className="plan-card">
            <div className="plan-rate">{(plan.rate * 100).toFixed(0)}%</div>
            <h3 className="plan-name">{plan.name} Plan</h3>
            <p className="plan-term">{plan.term}</p>
            <p className="plan-range">${plan.min.toLocaleString()} – ${plan.max.toLocaleString()}</p>
            <button onClick={() => handleInvest(plan)} className="invest-btn">
              Invest Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}