import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import DepositModal from '../components/DepositModal';
import '../styles/InvestNow.css';

export default function InvestNow() {
  const location = useLocation();
  const plan = location.state?.plan;
  const [amount, setAmount] = useState('');
  const [showDeposit, setShowDeposit] = useState(false);
  const { token, fetchUser } = useAuth();
  const navigate = useNavigate();

  const handleInvest = async () => {
    if (!amount || amount < plan.min || amount > plan.max) {
      alert(`Enter amount between $${plan.min}–$${plan.max}`);
      return;
    }

    try {
      await axios.post('/api/investments/invest', { plan: plan.name.toLowerCase(), amount: Number(amount) }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchUser();
      alert('Investment successful!');
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.needsDeposit) {
        alert(`Need $${err.response.data.required} more. Opening deposit...`);
        setShowDeposit(true);
      } else {
        alert(err.response?.data?.message || 'Error');
      }
    }
  };

  if (!plan) return <div className="text-center">Invalid plan</div>;

  const profit = amount ? (amount * plan.rate).toFixed(2) : '0.00';

  return (
    <div className="investnow-container">
      <div className="investnow-header">
        <h1>{plan.name} Investment</h1>
        <div className="plan-badge">{plan.term} • {(plan.rate * 100).toFixed(0)}% ROI</div>
      </div>

      <div className="invest-form">
        <div className="amount-input-group">
          <label>Investment Amount</label>
          <div style={{ position: 'relative' }}>
            <span className="currency-symbol">$</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={`Min: $${plan.min}`}
              className="amount-input"
            />
          </div>
          <p className="text-xs text-secondary mt-1">Max: ${plan.max.toLocaleString()}</p>
        </div>

        {amount >= plan.min && (
          <div className="return-preview">
            <div className="return-label">Expected Profit</div>
            <div className="return-amount">${profit}</div>
            <div className="return-term">After {plan.term}</div>
          </div>
        )}

        <button
          onClick={handleInvest}
          disabled={!amount || amount < plan.min}
          className="confirm-btn"
        >
          Confirm Investment
        </button>
      </div>

      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} />}
    </div>
  );
}