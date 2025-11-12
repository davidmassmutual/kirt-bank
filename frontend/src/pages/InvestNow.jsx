import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import DepositModal from '../components/DepositModal';

export default function InvestNow() {
  const location = useLocation();
  const plan = location.state?.plan;
  const [amount, setAmount] = useState('');
  const [showDeposit, setShowDeposit] = useState(false);
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const handleInvest = async () => {
    if (!amount || amount < plan.min || amount > plan.max) {
      alert(`Enter amount between $${plan.min}–$${plan.max}`);
      return;
    }

    try {
      const res = await axios.post('/api/investments/invest', { plan: plan.name.toLowerCase(), amount: Number(amount) }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.message);
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

  if (!plan) return <div>Invalid plan</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">{plan.name} Investment</h1>
      <p className="text-secondary mb-8">Term: {plan.term} • ROI: {(plan.rate * 100).toFixed(0)}%</p>

      <div className="bg-card rounded-2xl p-8 mb-6">
        <div className="mb-6">
          <label className="block text-sm font-bold mb-2">Investment Amount</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder={`Min: $${plan.min}`}
            className="input text-xl"
          />
          <p className="text-xs text-secondary mt-2">Max: ${plan.max}</p>
        </div>

        {amount >= plan.min && (
          <div className="bg-gold/10 border border-gold rounded-xl p-4 mb-6">
            <p className="text-sm">Expected Return</p>
            <p className="text-2xl font-bold">${(amount * plan.rate).toFixed(2)}</p>
            <p className="text-xs">After {plan.term}</p>
          </div>
        )}

        <button onClick={handleInvest} className="btn-primary w-full text-lg py-4">
          Confirm Investment
        </button>
      </div>

      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} />}
    </div>
  );
}